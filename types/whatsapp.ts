export interface WhatsAppRule {
  _id?: string;
  topic: string;
  customTopic?: string;
  response: string;
  isCustom: boolean;
  isActive: boolean;
}

export interface WhatsAppConfig {
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
} 