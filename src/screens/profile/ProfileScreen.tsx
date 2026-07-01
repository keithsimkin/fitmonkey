import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProfileForm } from './ProfileForm';

export function ProfileScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-full pb-24">
      <PageHeader title="Your Profile" onBack={() => navigate(-1)} />
      <div className="px-4 pt-3">
        <p className="mb-5 px-1 text-[14px] text-neutral-500 dark:text-neutral-400">
          Your details drive the workout engine — it picks your split, exercises, sets, reps and
          rest from these.
        </p>
        <ProfileForm onDone={() => navigate(-1)} />
      </div>
    </div>
  );
}
