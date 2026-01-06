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
  children?: SubItem[];
}

export interface MenuItem {
  label: string;
  route: string;
  icon: LucideIcon;
  requiredResource?: string;
  children?: SubItem[];
}

export const getMenuItems = (companyId: string | null): MenuItem[] => {

  const allCompaniesChildren: SubItem[] = [];

  if (companyId) {
    allCompaniesChildren.push(
      {
        label: 'Overview',
        route: `/companies/${companyId}`,
        icon: Store,
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

  const companyChildren: SubItem[] = [
    {
      label: 'All Companies',
      route: '/companies',
      icon: List,
      children: allCompaniesChildren,
    },
    {
      label: 'Create Company',
      route: '/companies/create',
      icon: Plus,
    }
  ];

  return [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: LayoutDashboard,
      requiredResource: 'dashboard',
    },
    {
      label: 'Companies',
      route: '/companies',
      icon: Building,
      requiredResource: 'companies',
      children: companyChildren,
    },
    {
      label: 'Subscriptions',
      route: '/subscriptions',
      icon: CreditCard,
      requiredResource: 'subscriptions',
      children: [
        {
          label: 'All Packages',
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
