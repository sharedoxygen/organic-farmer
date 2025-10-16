/**
 * Party Service
 * Unified service for managing parties (farms, users, customers, suppliers)
 * Replaces separate customer/user/supplier services
 */

import { prisma } from '@/lib/db';

export type PartyType = 'PERSON' | 'ORGANIZATION';
export type PartyRoleType = 
  | 'FARM' 
  | 'CUSTOMER_B2B' 
  | 'CUSTOMER_B2C' 
  | 'USER' 
  | 'SUPPLIER' 
  | 'DISTRIBUTOR' 
  | 'EMPLOYEE' 
  | 'SYSTEM_ADMIN';

export type ContactType = 'EMAIL' | 'PHONE' | 'MOBILE' | 'FAX' | 'ADDRESS' | 'URL' | 'SOCIAL' | 'OTHER';
export type RelationshipType = 'OWNS' | 'MANAGES' | 'EMPLOYS' | 'SUPPLIES' | 'DISTRIBUTES' | 'MEMBER_OF' | 'PARENT_OF' | 'SUBSIDIARY_OF' | 'RELATED_TO';

export interface Party {
  id: string;
  displayName: string;
  legalName?: string | null;
  partyType: PartyType;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartyRole {
  id: string;
  partyId: string;
  roleType: PartyRoleType;
  farm_id?: string | null;
  metadata?: any;
  createdAt: Date;
}

export interface PartyContact {
  id: string;
  partyId: string;
  type: ContactType;
  label?: string | null;
  value: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartyWithDetails extends Party {
  roles: PartyRole[];
  contacts: PartyContact[];
}

export class PartyService {
  /**
   * Get party by ID with roles and contacts
   */
  static async getParty(partyId: string): Promise<PartyWithDetails | null> {
    const party = await prisma.parties.findUnique({
      where: { id: partyId },
      include: {
        roles: true,
        contacts: true
      }
    });

    return party as any;
  }

  /**
   * Get all parties for a farm with specific role
   */
  static async getPartiesByRole(farmId: string, roleType: PartyRoleType): Promise<PartyWithDetails[]> {
    const parties = await prisma.parties.findMany({
      where: {
        roles: {
          some: {
            farm_id: farmId,
            roleType
          }
        }
      },
      include: {
        roles: {
          where: { farm_id: farmId }
        },
        contacts: true
      }
    });

    return parties as any;
  }

  /**
   * Get all customers for a farm (B2B and B2C)
   */
  static async getCustomers(farmId: string, type?: 'B2B' | 'B2C'): Promise<PartyWithDetails[]> {
    const roleTypes: PartyRoleType[] = type === 'B2B' 
      ? ['CUSTOMER_B2B'] 
      : type === 'B2C' 
        ? ['CUSTOMER_B2C'] 
        : ['CUSTOMER_B2B', 'CUSTOMER_B2C'];

    const parties = await prisma.parties.findMany({
      where: {
        roles: {
          some: {
            farm_id: farmId,
            roleType: { in: roleTypes }
          }
        }
      },
      include: {
        roles: {
          where: { farm_id: farmId }
        },
        contacts: true
      }
    });

    return parties as any;
  }

  /**
   * Get all suppliers for a farm
   */
  static async getSuppliers(farmId: string): Promise<PartyWithDetails[]> {
    return await this.getPartiesByRole(farmId, 'SUPPLIER');
  }

  /**
   * Get all employees for a farm
   */
  static async getEmployees(farmId: string): Promise<PartyWithDetails[]> {
    return await this.getPartiesByRole(farmId, 'EMPLOYEE');
  }

  /**
   * Create a new party
   */
  static async createParty(data: {
    displayName: string;
    legalName?: string;
    partyType: PartyType;
    roles: Array<{
      roleType: PartyRoleType;
      farm_id?: string;
      metadata?: any;
    }>;
    contacts: Array<{
      type: ContactType;
      label?: string;
      value: string;
      isPrimary?: boolean;
    }>;
  }): Promise<PartyWithDetails> {
    const party = await prisma.parties.create({
      data: {
        displayName: data.displayName,
        legalName: data.legalName,
        partyType: data.partyType,
        roles: {
          create: data.roles
        },
        contacts: {
          create: data.contacts
        }
      },
      include: {
        roles: true,
        contacts: true
      }
    });

    return party as any;
  }

  /**
   * Update party
   */
  static async updateParty(partyId: string, data: Partial<{
    displayName: string;
    legalName: string;
  }>): Promise<Party> {
    const party = await prisma.parties.update({
      where: { id: partyId },
      data
    });

    return party;
  }

  /**
   * Add role to party
   */
  static async addRole(
    partyId: string, 
    roleType: PartyRoleType, 
    farm_id?: string, 
    metadata?: any
  ): Promise<PartyRole> {
    const role = await prisma.party_roles.create({
      data: {
        partyId,
        roleType,
        farm_id,
        metadata
      }
    });

    return role;
  }

  /**
   * Remove role from party
   */
  static async removeRole(roleId: string): Promise<void> {
    await prisma.party_roles.delete({
      where: { id: roleId }
    });
  }

  /**
   * Add contact to party
   */
  static async addContact(
    partyId: string,
    type: ContactType,
    value: string,
    label?: string,
    isPrimary?: boolean
  ): Promise<PartyContact> {
    const contact = await prisma.party_contacts.create({
      data: {
        partyId,
        type,
        label,
        value,
        isPrimary: isPrimary || false
      }
    });

    return contact;
  }

  /**
   * Update contact
   */
  static async updateContact(contactId: string, data: Partial<{
    value: string;
    label: string;
    isPrimary: boolean;
  }>): Promise<PartyContact> {
    const contact = await prisma.party_contacts.update({
      where: { id: contactId },
      data
    });

    return contact;
  }

  /**
   * Delete contact
   */
  static async deleteContact(contactId: string): Promise<void> {
    await prisma.party_contacts.delete({
      where: { id: contactId }
    });
  }

  /**
   * Get primary email for party
   */
  static async getPrimaryEmail(partyId: string): Promise<string | null> {
    const contact = await prisma.party_contacts.findFirst({
      where: {
        partyId,
        type: 'EMAIL',
        isPrimary: true
      }
    });

    return contact?.value || null;
  }

  /**
   * Get primary phone for party
   */
  static async getPrimaryPhone(partyId: string): Promise<string | null> {
    const contact = await prisma.party_contacts.findFirst({
      where: {
        partyId,
        type: 'PHONE',
        isPrimary: true
      }
    });

    return contact?.value || null;
  }

  /**
   * Create relationship between parties
   */
  static async createRelationship(
    partyId: string,
    relatedPartyId: string,
    relationship: RelationshipType,
    metadata?: any
  ): Promise<void> {
    await prisma.party_relationships.create({
      data: {
        partyId,
        relatedPartyId,
        relationship,
        metadata
      }
    });
  }

  /**
   * Delete party and all related data
   */
  static async deleteParty(partyId: string): Promise<void> {
    // Cascade delete handles roles, contacts, relationships
    await prisma.parties.delete({
      where: { id: partyId }
    });
  }

  /**
   * Check if party has specific role for a farm
   */
  static async hasRole(
    partyId: string, 
    roleType: PartyRoleType, 
    farmId?: string
  ): Promise<boolean> {
    const where: any = {
      partyId,
      roleType
    };

    if (farmId) {
      where.farm_id = farmId;
    }

    const role = await prisma.party_roles.findFirst({ where });
    return !!role;
  }
}

export default PartyService;

