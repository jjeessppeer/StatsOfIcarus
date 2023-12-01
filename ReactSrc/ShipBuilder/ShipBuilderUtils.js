
export function getSortedGunSlots(shipItem) {
    const gunSlots = [];
    for (let i = 0; i < shipItem.GunCount; i++) {
        const key = `gun-slot-${i + 1}`;
        const slot = shipItem.Slots[key];
        gunSlots.push(slot);
    }
    gunSlots.sort((a, b) => {
        if (a.Size == b.Size)
            return (a.Position.Z != b.Position.Z ? b.Position.Z - a.Position.Z : b.Position.X - a.Position.X)
        return b.Size - a.Size;
    });
    return gunSlots;
}
