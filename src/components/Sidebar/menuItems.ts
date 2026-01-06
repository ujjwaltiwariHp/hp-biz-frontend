import {
  Building,
  CreditCard,
  LayoutDashboard,
  ClipboardList,
  User,
  FileText,
  Package,
  Plus,
  List,
  Activity,
  Users,
  LucideIcon,
  Store
} from 'lucide-react';

export interface SubItem {
  label: string;
  route: string;
  icon?: LucideIcon;
}

export interface MenuItem {
  label: string;
  route: string;
  icon: LucideIcon;
  requiredResource?: string; // For permission checking
  children?: SubItem[];
}

// Function to generate items (allows injecting dynamic IDs like companyId)
export const getMenuItems = (companyId: string | null): MenuItem[] => {

  // 1. Define the base "Companies" children
  const companyChildren: SubItem[] = [
    {
      label: 'All Companies',
      route: '/companies',
      icon: List,
    },
    {
      label: 'Create Company',
      route: '/companies/create',
      icon: Plus,
    }
  ];

  // 2. If a Company ID is selected, inject the context-specific features
  if (companyId) {
    companyChildren.push(
      {
        label: 'Overview',
        route: `/companies/${companyId}`,
        icon: Store, // Differentiates the specific company view
      },
      {
        label: 'Subscriptions',
        route: `/companies/${companyId}/subscriptions`,
        icon: Package,
      },
      {
        label: 'Invoices',
        route: `/companies/${companyId}/invoices`,
        icon: FileText,
      },
      {
        label: 'Activity Logs',
        route: `/companies/${companyId}/logs`,
        icon: Activity,
      }
    );
  }

  return [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: LayoutDashboard,
      requiredResource: 'dashboard',
    },
    {
      label: 'Companies',
      route: '/companies', // Parent route
      icon: Building,
      requiredResource: 'companies',
      children: companyChildren, // Use the dynamic array
    },
    // Global Subscription Management (Plans/Packages)
    {
      label: 'Plan Management', // Renamed for clarity vs Company Subscriptions
      route: '/subscriptions',
      icon: CreditCard,
      requiredResource: 'subscriptions',
      children: [
        {
          label: 'Package List',
          route: '/subscriptions',
          icon: List,
        },
        {
          label: 'Create Package',
          route: '/subscriptions/create',
          icon: Plus,
        }
      ]
    },
    // Global/System Logs & Invoices (if needed, otherwise these can be removed)
    {
      label: 'All Invoices',
      route: '/invoices',
      icon: ClipboardList,
      requiredResource: 'invoices',
    },
    {
      label: 'System Logs',
      route: '/logs',
      icon: Activity,
      requiredResource: 'logging',
    },
    {
      label: 'Admin Management',
      route: '/settings',
      icon: Users,
      requiredResource: 'super_admins',
    },
  ];
};