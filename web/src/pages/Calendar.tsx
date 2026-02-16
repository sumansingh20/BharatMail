import { DashboardLayout } from '../components/DashboardLayout';
import GoogleCalendar from '../components/GoogleCalendar';
import { BhaMailTitle } from '../components/BhaMailTitle';

export function CalendarPage() {
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        <BhaMailTitle title="Calendar" />
        <div className="flex-1">
          <GoogleCalendar 
            isOpen={true} 
            onClose={() => {}}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}