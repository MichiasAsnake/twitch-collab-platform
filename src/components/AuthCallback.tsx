import { useStore } from '../store';

const setUser = useStore((state) => state.setUser);

// After successful auth
setUser({
  id: twitchUserId,
  displayName: twitchDisplayName,
  profileImageUrl: profileUrl
}); 