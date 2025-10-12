import { DashboardLayout } from '../components/DashboardLayout';
import GoogleDrive from '../components/GoogleDrive';
import { BhaMailTitle } from '../components/BhaMailTitle';

export function DrivePage() {
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        <BhaMailTitle title="Drive" />
        <div className="flex-1">
          <GoogleDrive 
            isOpen={true} 
            onClose={() => {}}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}