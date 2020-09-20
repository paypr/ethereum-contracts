const toByte4 = (value: number) => [(value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
export const byte4ToString = (value: number[]) => `0x${value.map((b) => b.toString(16).padStart(2, '0')).join('')}`;

export const ERC165_ID = toByte4(0x01ffc9a7);
export const ACTIVITY_ID = toByte4(0x00f62528);
export const ARTIFACT_ID = toByte4(0xd3abf7f1);
export const CONSUMABLE_ID = toByte4(0x0d6673db);
export const CONSUMABLE_CONSUMER_ID = toByte4(0x9342f6af);
export const CONSUMABLE_PROVIDER_ID = toByte4(0x63d9fe18);
export const CONSUMABLE_EXCHANGE_ID = toByte4(0x03c613c0);
export const CONVERTIBLE_CONSUMABLE_ID = toByte4(0xb669f4a6);
export const LIMITED_CONSUMABLE_ID = toByte4(0x81b8db38);
export const BASE_CONTRACT_ID = toByte4(0x321f350b);
export const PLAYER_ID = toByte4(0x9c833abb);
export const ROLE_DELEGATE_ID = toByte4(0x7cef57ea);
export const SKILL_ID = toByte4(0xa87617d1);
export const SKILL_CONSTRAINED_ID = toByte4(0x332b3661);
export const TRANSFERRING_ID = toByte4(0x6fafa3a8);
