type DefaultMemojiAvatarProps = {
  className?: string
  seed: string
}

const BACKGROUNDS = ["#DCE9D8", "#E7F0FF", "#F8E5CF", "#F2DDEA", "#DFF2EF", "#F4EDC9"]
const SHIRTS = ["#033927", "#174EA6", "#8A3FFC", "#B84A39", "#4C6B2F", "#203129"]
const SKINS = ["#C98F68", "#A96B4F", "#E0AA7A", "#8F5B45", "#D39A75", "#B77756"]
const HAIRS = ["#2A2019", "#4A2E1D", "#111827", "#6B3F24", "#7C2D12", "#3D2B1F"]

export function DefaultMemojiAvatar({ className = "", seed }: DefaultMemojiAvatarProps) {
  const hash = hashSeed(seed)
  const background = pick(BACKGROUNDS, hash)
  const shirt = pick(SHIRTS, hash >> 3)
  const skin = pick(SKINS, hash >> 6)
  const hair = pick(HAIRS, hash >> 9)
  const accent = pick(SHIRTS, hash >> 12)
  const hairStyle = hash % 3
  const hasGlasses = hash % 5 === 0
  const smileWide = hash % 2 === 0

  return (
    <svg className={className} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="240" height="240" rx="72" fill="#F0F4F1" />
      <circle cx="120" cy="120" r="92" fill={background} />
      <path d="M54 205c10.6-37.8 35.4-58 66-58s55.4 20.2 66 58H54Z" fill={shirt} />
      <path d="M73 104c0-38.1 20.8-64 47-64s47 25.9 47 64v13c0 37.2-21 62-47 62s-47-24.8-47-62v-13Z" fill={skin} />
      <path d="M74 110c-10.4.2-18 8.2-18 18.8 0 10.8 7.9 18.6 19.5 19.2L74 110Z" fill={skin} />
      <path d="M166 110c10.4.2 18 8.2 18 18.8 0 10.8-7.9 18.6-19.5 19.2L166 110Z" fill={skin} />
      {hairStyle === 0 ? (
        <path d="M68 105c2.4-45.4 24-72 58.7-72 21.6 0 42 14.8 47.3 42.3-21.2-7.1-38.5-18.6-51.7-34.4-9.8 23.8-28.1 39.6-54.3 47.4V105Z" fill={hair} />
      ) : hairStyle === 1 ? (
        <path d="M72 96c5.8-38.4 28.5-61.5 59-58.4 21.7 2.2 38.3 20.4 39.8 47.4-15.4-6.7-30.4-9.4-45-8.1-17.1 1.5-34.9 7.9-53.8 19.1Z" fill={hair} />
      ) : (
        <path d="M70 99c.5-37.3 19.5-63.5 49.8-63.5 26.4 0 46.2 20.2 50.2 52.5-14.1-1.9-27-6.4-38.8-13.5-16.5 13-36.9 21.2-61.2 24.5Z" fill={hair} />
      )}
      <path d="M96 111c5.8-4 12.2-4 18 0" stroke={hair} strokeWidth="6" strokeLinecap="round" />
      <path d="M126 111c5.8-4 12.2-4 18 0" stroke={hair} strokeWidth="6" strokeLinecap="round" />
      <circle cx="105" cy="124" r="5" fill="#1D1714" />
      <circle cx="135" cy="124" r="5" fill="#1D1714" />
      {hasGlasses ? (
        <path d="M92 122h25m6 0h25M96 117h17a9 9 0 0 1 0 18H96a9 9 0 0 1 0-18Zm31 0h17a9 9 0 0 1 0 18h-17a9 9 0 0 1 0-18Z" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      ) : null}
      <path d="M121 126c-1.7 8-3.2 13.5-5.5 18h10" stroke="#8E5F45" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={smileWide ? "M102 154c10.4 9.8 25.2 9.8 36 0" : "M108 156c7.8 5.5 16.2 5.5 24 0"} stroke="#7B3D2B" strokeWidth="6" strokeLinecap="round" />
      <circle cx="178" cy="62" r="23" fill={accent} />
      <path d="M168 62.5l7 7 13-15" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function hashSeed(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return hash
}

function pick<T>(items: T[], hash: number) {
  return items[hash % items.length]
}
