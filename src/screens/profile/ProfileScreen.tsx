import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProfileForm } from './ProfileForm';
import { CoachSetup } from './CoachSetup';

export function ProfileScreen() {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.profile);

  // First-time users get the guided, one-question-at-a-time coach setup; once a
  // profile exists, editing happens in the full single-page form.
  if (!profile) {
    return (
      <CoachSetup onDone={() => navigate('/', { replace: true })} onExit={() => navigate(-1)} />
    );
  }

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
