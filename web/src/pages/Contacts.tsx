import { DashboardLayout } from '../components/DashboardLayout';
import GoogleContacts from '../components/GoogleContacts';
import { BhaMailTitle } from '../components/BhaMailTitle';

export function ContactsPage() {
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        <BhaMailTitle title="Contacts" />
        <div className="flex-1">
          <GoogleContacts 
            isOpen={true} 
            onClose={() => {}} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}