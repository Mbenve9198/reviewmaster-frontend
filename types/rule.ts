export interface Rule {
  _id?: string;
  hotelId: string;
  name: string;
  condition: {
    field: 'content.text' | 'content.rating' | 'content.language';
    operator: 'contains' | 'equals' | 'greater_than' | 'less_than';
    value: string | string[] | number;
  };
  response: {
    text: string;
    settings: {
      style: 'professional' | 'friendly';
      length: 'short' | 'medium' | 'long';
    };
  };
  isActive?: boolean;
} 