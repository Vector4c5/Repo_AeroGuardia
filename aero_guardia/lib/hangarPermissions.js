export function canManageAircraft(hangar, userId) {
  if (!hangar || !userId) {
    return false;
  }

  const targetId = userId.toString();

  const ownerId = hangar.owner?._id?.toString() || hangar.owner?.toString();
  if (ownerId === targetId) {
    return true;
  }

  return (hangar.members || []).some((entry) => {
    const memberId = entry.user?._id?.toString() || entry.user?.toString();
    return memberId === targetId && entry.role === "admin";
  });
}
