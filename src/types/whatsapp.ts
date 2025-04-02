export interface WhatsAppRule {
  _id: string;
  question?: string;
  response: string;
  isActive: boolean;
  topic: string;
  isCustom?: boolean;
  customTopic?: string;
  keywords?: string[];
}

export interface WhatsAppConfig {
  _id: string;
  hotelId: string;
  timezone: string;
  breakfast: {
    startTime: string;
    endTime: string;
  };
  checkIn: {
    startTime: string;
    endTime: string;
  };
  reviewLink: string;
  reviewRequestDelay: number;
  triggerName: string;
  isActive: boolean;
  rules: WhatsAppRule[];
  messageLimits?: {
    inboundPerDay: number;
    outboundPerDay: number;
    enabled: boolean;
  };
} 