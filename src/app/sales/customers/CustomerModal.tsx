'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import styles from './CustomerModal.module.css';

interface Party {
  id: string;
  displayName: string;
  legalName: string | null;
  partyType: 'PERSON' | 'ORGANIZATION';
}

interface PartyRole {
  id: string;
  roleType: 'CUSTOMER_B2B' | 'CUSTOMER_B2C';
  metadata: any;
}

interface PartyContact {
  id: string;
  type: 'EMAIL' | 'PHONE' | 'MOBILE' | 'ADDRESS';
  label: string | null;
  value: string;
  isPrimary: boolean;
}

interface Customer {
  party: Party;
  role: PartyRole;
  contacts: PartyContact[];
}

interface CustomerModalProps {
  mode: 'add' | 'edit';
  customer: Customer | null;
  onClose: () => void;
  onSave: () => void;
}

export default function CustomerModal({ mode, customer, onClose, onSave }: CustomerModalProps) {
  const { currentFarm } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [customerType, setCustomerType] = useState<'B2B' | 'B2C'>('B2B');
  const [partyType, setPartyType] = useState<'PERSON' | 'ORGANIZATION'>('ORGANIZATION');
  const [displayName, setDisplayName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('USA');
  const [status, setStatus] = useState('ACTIVE');
  const [paymentTerms, setPaymentTerms] = useState('NET_30');
  const [creditLimit, setCreditLimit] = useState('0');
  const [orderFrequency, setOrderFrequency] = useState('WEEKLY');
  const [preferredVarieties, setPreferredVarieties] = useState('');

  useEffect(() => {
    if (customer) {
      setCustomerType(customer.role.roleType === 'CUSTOMER_B2B' ? 'B2B' : 'B2C');
      setPartyType(customer.party.partyType);
      setDisplayName(customer.party.displayName);
      setLegalName(customer.party.legalName || '');
      
      const emailContact = customer.contacts.find(c => c.type === 'EMAIL');
      const phoneContact = customer.contacts.find(c => c.type === 'PHONE' || c.type === 'MOBILE');
      const addressContact = customer.contacts.find(c => c.type === 'ADDRESS');

      if (emailContact) setEmail(emailContact.value);
      if (phoneContact) setPhone(phoneContact.value);
      
      if (addressContact) {
        try {
          const address = JSON.parse(addressContact.value);
          setStreet(address.street || '');
          setCity(address.city || '');
          setState(address.state || '');
          setZipCode(address.zipCode || '');
          setCountry(address.country || 'USA');
        } catch (e) {
          console.error('Failed to parse address:', e);
        }
      }

      const metadata = customer.role.metadata || {};
      setStatus(metadata.status || 'ACTIVE');
      setPaymentTerms(metadata.paymentTerms || 'NET_30');
      setCreditLimit(String(metadata.creditLimit || 0));
      setOrderFrequency(metadata.orderFrequency || 'WEEKLY');
      setPreferredVarieties(metadata.preferredVarieties || '');
    }
  }, [customer]);

  // Update partyType when customerType changes
  useEffect(() => {
    if (customerType === 'B2B') {
      setPartyType('ORGANIZATION');
    } else {
      setPartyType('PERSON');
    }
  }, [customerType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName || !email) {
      setError('Display name and email are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'X-Farm-ID': currentFarm?.id || '',
        'Content-Type': 'application/json'
      };
      
      const userData = typeof window !== 'undefined' ? localStorage.getItem('ofms_user') : null;
      if (userData) {
        const user = JSON.parse(userData);
        if (user?.id) headers['Authorization'] = `Bearer ${user.id}`;
      }

      const payload = {
        displayName,
        legalName: legalName || null,
        partyType,
        roleType: customerType === 'B2B' ? 'CUSTOMER_B2B' : 'CUSTOMER_B2C',
        contacts: [
          {
            type: 'EMAIL',
            label: 'Primary Email',
            value: email,
            isPrimary: true
          },
          ...(phone ? [{
            type: 'PHONE',
            label: 'Primary Phone',
            value: phone,
            isPrimary: true
          }] : []),
          ...(street || city ? [{
            type: 'ADDRESS',
            label: 'Primary Address',
            value: JSON.stringify({ street, city, state, zipCode, country }),
            isPrimary: true
          }] : [])
        ],
        metadata: {
          status,
          paymentTerms,
          creditLimit: parseFloat(creditLimit) || 0,
          orderFrequency,
          preferredVarieties
        }
      };

      const url = mode === 'add' 
        ? '/api/parties/customers'
        : `/api/parties/customers/${customer?.party.id}`;
      
      const method = mode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save customer');
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving customer:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{mode === 'add' ? 'Add New Customer' : 'Edit Customer'}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && (
            <div className={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Customer Type */}
          <div className={styles.formGroup}>
            <label>Customer Type *</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="B2B"
                  checked={customerType === 'B2B'}
                  onChange={(e) => setCustomerType(e.target.value as 'B2B')}
                  disabled={mode === 'edit'}
                />
                <span>B2B (Business)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="B2C"
                  checked={customerType === 'B2C'}
                  onChange={(e) => setCustomerType(e.target.value as 'B2C')}
                  disabled={mode === 'edit'}
                />
                <span>B2C (Individual)</span>
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Display Name *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={customerType === 'B2B' ? 'Business Name' : 'Full Name'}
                required
              />
            </div>

            {customerType === 'B2B' && (
              <div className={styles.formGroup}>
                <label>Legal Name</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Official Legal Name"
                />
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Address */}
          <div className={styles.formGroup}>
            <label>Street Address</label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="123 Main Street"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Portland"
              />
            </div>

            <div className={styles.formGroup}>
              <label>State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="OR"
                maxLength={2}
              />
            </div>

            <div className={styles.formGroup}>
              <label>ZIP Code</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="97201"
              />
            </div>
          </div>

          {/* Business Details */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Order Frequency</label>
              <select value={orderFrequency} onChange={(e) => setOrderFrequency(e.target.value)}>
                <option value="DAILY">Daily</option>
                <option value="TWICE_WEEKLY">Twice Weekly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BI_WEEKLY">Bi-Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
          </div>

          {customerType === 'B2B' && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Payment Terms</label>
                <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                  <option value="IMMEDIATE">Immediate</option>
                  <option value="NET_15">Net 15</option>
                  <option value="NET_30">Net 30</option>
                  <option value="NET_60">Net 60</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Credit Limit</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Preferred Varieties</label>
            <textarea
              value={preferredVarieties}
              onChange={(e) => setPreferredVarieties(e.target.value)}
              placeholder="Arugula, Basil, Microgreens Mix..."
              rows={3}
            />
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Add Customer' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
