export type BookingLine = {
  "Sales Order Number": string;
  "Deal ID": string;
  "End Customer Company Name": string;
  "End Customer Name": string;
  "Booked Date": string;
  "Bookings Type": string;
  "Sales Motion": string;
  "Annual Bookings": number;
  "MY Bookings": number;
  "Total Bookings": number;
  "Sales Agent Name": string;
  L5: string;
  "Product Classification": string;
  "Service Category": string;
  "CX Product": string;
};

export type WorkbookData = {
  sourceFile: string;
  originalName: string;
  sheets: string[];
  sheet: string;
  title: string;
  bakedFilters: string[];
  headers: string[];
  lines: BookingLine[];
};
