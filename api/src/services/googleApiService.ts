import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger';

interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  accessToken?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
}

interface GoogleContact {
  resourceName: string;
  etag: string;
  names?: Array<{
    displayName?: string;
    givenName?: string;
    familyName?: string;
  }>;
  emailAddresses?: Array<{
    value: string;
    type?: string;
    formattedType?: string;
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
    formattedType?: string;
  }>;
  organizations?: Array<{
    name?: string;
    title?: string;
    type?: string;
  }>;
  photos?: Array<{
    url: string;
    metadata?: any;
  }>;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  owners?: Array<{
    displayName: string;
    emailAddress: string;
  }>;
  shared?: boolean;
}

export class GoogleApiService {
  private oauth2Clients = new Map<string, OAuth2Client>();

  private createOAuth2Client(config: GoogleAuthConfig): OAuth2Client {
    const oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken
    });

    return oauth2Client;
  }

  async setupGoogleAuth(userId: string, config: GoogleAuthConfig): Promise<void> {
    try {
      const oauth2Client = this.createOAuth2Client(config);
      this.oauth2Clients.set(userId, oauth2Client);
      
      logger.info(`Google API auth setup for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to setup Google auth for user ${userId}:`, error);
      throw error;
    }
  }

  async getCalendarEvents(userId: string, options: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    orderBy?: string;
  } = {}): Promise<CalendarEvent[]> {
    const oauth2Client = this.oauth2Clients.get(userId);
    if (!oauth2Client) {
      throw new Error('Google auth not configured for user');
    }

    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      const response = await calendar.events.list({
        calendarId: options.calendarId || 'primary',
        timeMin: options.timeMin || new Date().toISOString(),
        timeMax: options.timeMax,
        maxResults: options.maxResults || 10,
        singleEvents: true,
        orderBy: options.orderBy || 'startTime'
      });

      const events = response.data.items || [];
      
      return events.map(event => ({
        id: event.id || '',
        summary: event.summary || '',
        description: event.description,
        start: {
          dateTime: event.start?.dateTime,
          date: event.start?.date,
          timeZone: event.start?.timeZone
        },
        end: {
          dateTime: event.end?.dateTime,
          date: event.end?.date,
          timeZone: event.end?.timeZone
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email || '',
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus
        })),
        location: event.location,
        htmlLink: event.htmlLink,
        created: event.created,
        updated: event.updated
      }));
    } catch (error) {
      logger.error('Failed to fetch calendar events:', error);
      throw error;
    }
  }

  async createCalendarEvent(userId: string, eventData: {
    summary: string;
    description?: string;
    start: {
      dateTime?: string;
      date?: string;
      timeZone?: string;
    };
    end: {
      dateTime?: string;
      date?: string;
      timeZone?: string;
    };
    attendees?: Array<{ email: string }>;
    location?: string;
    calendarId?: string;
  }): Promise<CalendarEvent> {
    const oauth2Client = this.oauth2Clients.get(userId);
    if (!oauth2Client) {
      throw new Error('Google auth not configured for user');
    }

    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      const response = await calendar.events.insert({
        calendarId: eventData.calendarId || 'primary',
        requestBody: {
          summary: eventData.summary,
          description: eventData.description,
          start: eventData.start,
          end: eventData.end,
          attendees: eventData.attendees,
          location: eventData.location
        }
      });

      const event = response.data;
      
      return {
        id: event.id || '',
        summary: event.summary || '',
        description: event.description,
        start: {
          dateTime: event.start?.dateTime,
          date: event.start?.date,
          timeZone: event.start?.timeZone
        },
        end: {
          dateTime: event.end?.dateTime,
          date: event.end?.date,
          timeZone: event.end?.timeZone
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email || '',
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus
        })),
        location: event.location,
        htmlLink: event.htmlLink,
        created: event.created,
        updated: event.updated
      };
    } catch (error) {
      logger.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  async getContacts(userId: string, options: {
    pageSize?: number;
    pageToken?: string;
    personFields?: string;
  } = {}): Promise<{ contacts: GoogleContact[]; nextPageToken?: string }> {
    const oauth2Client = this.oauth2Clients.get(userId);
    if (!oauth2Client) {
      throw new Error('Google auth not configured for user');
    }

    try {
      const people = google.people({ version: 'v1', auth: oauth2Client });
      
      const response = await people.people.connections.list({
        resourceName: 'people/me',
        pageSize: options.pageSize || 50,
        pageToken: options.pageToken,
        personFields: options.personFields || 'names,emailAddresses,phoneNumbers,organizations,photos'
      });

      const connections = response.data.connections || [];
      
      return {
        contacts: connections.map(contact => ({
          resourceName: contact.resourceName || '',
          etag: contact.etag || '',
          names: contact.names,
          emailAddresses: contact.emailAddresses,
          phoneNumbers: contact.phoneNumbers,
          organizations: contact.organizations,
          photos: contact.photos
        })),
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      logger.error('Failed to fetch contacts:', error);
      throw error;
    }
  }

  async createContact(userId: string, contactData: {
    givenName?: string;
    familyName?: string;
    emailAddress?: string;
    phoneNumber?: string;
    organization?: string;
    title?: string;
  }): Promise<GoogleContact> {
    const oauth2Client = this.oauth2Clients.get(userId);
    if (!oauth2Client) {
      throw new Error('Google auth not configured for user');
    }

    try {
      const people = google.people({ version: 'v1', auth: oauth2Client });
      
      const response = await people.people.createContact({
        requestBody: {
          names: contactData.givenName || contactData.familyName ? [{
            givenName: contactData.givenName,
            familyName: contactData.familyName
          }] : undefined,
          emailAddresses: contactData.emailAddress ? [{
            value: contactData.emailAddress
          }] : undefined,
          phoneNumbers: contactData.phoneNumber ? [{
            value: contactData.phoneNumber
          }] : undefined,
          organizations: contactData.organization || contactData.title ? [{
            name: contactData.organization,
            title: contactData.title
          }] : undefined
        }
      });

      const contact = response.data;
      
      return {
        resourceName: contact.resourceName || '',
        etag: contact.etag || '',
        names: contact.names,
        emailAddresses: contact.emailAddresses,
        phoneNumbers: contact.phoneNumbers,
        organizations: contact.organizations,
        photos: contact.photos
      };
    } catch (error) {
      logger.error('Failed to create contact:', error);
      throw error;
    }
  }

  async getDriveFiles(userId: string, options: {
    q?: string;
    pageSize?: number;
    pageToken?: string;
    orderBy?: string;
    fields?: string;
  } = {}): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
    const oauth2Client = this.oauth2Clients.get(userId);
    if (!oauth2Client) {
      throw new Error('Google auth not configured for user');
    }

    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      const response = await drive.files.list({
        q: options.q,
        pageSize: options.pageSize || 50,
        pageToken: options.pageToken,
        orderBy: options.orderBy || 'modifiedTime desc',
        fields: options.fields || 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners)'
      });

      const files = response.data.files || [];
      
      return {
        files: files.map(file => ({
          id: file.id || '',
          name: file.name || '',
          mimeType: file.mimeType || '',
          size: file.size,
          createdTime: file.createdTime || '',
          modifiedTime: file.modifiedTime || '',
          webViewLink: file.webViewLink,
          webContentLink: file.webContentLink,
          thumbnailLink: file.thumbnailLink,
          parents: file.parents,
          owners: file.owners?.map(owner => ({
            displayName: owner.displayName || '',
            emailAddress: owner.emailAddress || ''
          })),
          shared: file.shared
        })),
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      logger.error('Failed to fetch Drive files:', error);
      throw error;
    }
  }

  async uploadDriveFile(userId: string, fileData: {
    name: string;
    content: Buffer;
    mimeType: string;
    parents?: string[];
  }): Promise<DriveFile> {
    const oauth2Client = this.oauth2Clients.get(userId);
    if (!oauth2Client) {
      throw new Error('Google auth not configured for user');
    }

    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      const response = await drive.files.create({
        requestBody: {
          name: fileData.name,
          parents: fileData.parents
        },
        media: {
          mimeType: fileData.mimeType,
          body: fileData.content
        },
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents, owners'
      });

      const file = response.data;
      
      return {
        id: file.id || '',
        name: file.name || '',
        mimeType: file.mimeType || '',
        size: file.size,
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        parents: file.parents,
        owners: file.owners?.map(owner => ({
          displayName: owner.displayName || '',
          emailAddress: owner.emailAddress || ''
        })),
        shared: file.shared
      };
    } catch (error) {
      logger.error('Failed to upload Drive file:', error);
      throw error;
    }
  }

  async shareDriveFile(userId: string, fileId: string, shareData: {
    type: 'user' | 'group' | 'domain' | 'anyone';
    role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
    emailAddress?: string;
    domain?: string;
  }): Promise<void> {
    const oauth2Client = this.oauth2Clients.get(userId);
    if (!oauth2Client) {
      throw new Error('Google auth not configured for user');
    }

    try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          type: shareData.type,
          role: shareData.role,
          emailAddress: shareData.emailAddress,
          domain: shareData.domain
        }
      });

      logger.info(`Shared Drive file ${fileId} with ${shareData.emailAddress || shareData.domain || shareData.type}`);
    } catch (error) {
      logger.error('Failed to share Drive file:', error);
      throw error;
    }
  }

  async getGoogleProfile(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
    locale?: string;
  }> {
    const oauth2Client = this.oauth2Clients.get(userId);
    if (!oauth2Client) {
      throw new Error('Google auth not configured for user');
    }

    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      
      const response = await oauth2.userinfo.get();
      const profile = response.data;
      
      return {
        id: profile.id || '',
        email: profile.email || '',
        name: profile.name || '',
        picture: profile.picture,
        locale: profile.locale
      };
    } catch (error) {
      logger.error('Failed to fetch Google profile:', error);
      throw error;
    }
  }

  async refreshAccessToken(userId: string): Promise<string> {
    const oauth2Client = this.oauth2Clients.get(userId);
    if (!oauth2Client) {
      throw new Error('Google auth not configured for user');
    }

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      
      logger.info(`Refreshed access token for user ${userId}`);
      return credentials.access_token || '';
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  disconnect(userId: string): void {
    this.oauth2Clients.delete(userId);
    logger.info(`Disconnected Google API for user ${userId}`);
  }

  disconnectAll(): void {
    this.oauth2Clients.clear();
    logger.info('Disconnected all Google API clients');
  }
}

export const googleApiService = new GoogleApiService();