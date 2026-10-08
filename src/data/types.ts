export type Kpi = {
  label: string;
  value: number;
};

export type BreakdownRow = {
  "Category / Classification": string;
  "Deal Count": number;
  "Total Pipeline Value (TCV)": number;
  "Forecasted Services": number;
  "Avg Services Attach %": number;
  "Primary Risk / Next Action": string;
  isTotal: boolean;
};

export type Deal = {
  "Opportunity Name": string;
  "Account Name": string;
  "Assigned AM": string;
  Stage: string;
  "Close Date": string;
  "Total TCV (USD)": number;
  "Technology (HW/SW)": number;
  "Forecasted Services": number;
  "Services Attach %": number;
  "Salesforce Deal ID": string | null;
  "CCW Quote Status": string;
  "Primary Workload": string;
  "Governance & Action Plan": string;
  _closeQuarter: string;
  _amPlaceholder: boolean;
};

export type RemediationGroup = {
  "Action Group": string;
  "Target Deals": string;
  "Total TCV": number;
  "Key Vulnerability / Gap": string;
  "Step-by-Step Remediation Action": string;
  "Forwardable Partner Guidance": string;
};

export type WorkbookData = {
  sourceFile: string;
  sheets: string[];
  executiveSummary: {
    title: string;
    scope: string;
    kpis: Kpi[];
    breakdownTitle: string;
    breakdownHeaders: string[];
    breakdown: BreakdownRow[];
  };
  flaggedOpportunities: {
    title: string;
    scope: string;
    headers: string[];
    deals: Deal[];
  };
  remediationPlan: {
    title: string;
    subtitle: string;
    groups: RemediationGroup[];
  };
};
