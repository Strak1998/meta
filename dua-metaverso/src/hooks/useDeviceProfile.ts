import { useState, useEffect } from 'react';
import { DeviceProfile, getDeviceProfile } from '@/lib/device-profile';

export { getDeviceProfile } from '@/lib/device-profile';
export type { DeviceProfile, DeviceTier } from '@/lib/device-profile';

export function useDeviceProfile(): DeviceProfile | null {
  const [profile, setProfile] = useState<DeviceProfile | null>(null);

  useEffect(() => {
    setProfile(getDeviceProfile());
  }, []);

  return profile;
}
