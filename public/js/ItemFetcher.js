const itemCache = {};
export async function getItem(itemType, itemId) {
    const url = `/game-item/${itemType}/${itemId}`;

    // Return cached.
    if (url in itemCache) return itemCache[url];

    const response = await fetch(`/game-item/${itemType}/${itemId}`);
    const json = await response.json();
    itemCache[url] = json;
    return json;
}