export function formatDate(dateInput: string | Date, format: string = "dd-MM-yyyy 'at' HH:mm:ss"): string {
  const date = new Date(dateInput)

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? ''

  const map: Record<string, string> = {
    dd: get('day'),
    d: String(Number(get('day'))),
    MM: new Intl.DateTimeFormat('en-GB', { month: '2-digit' }).format(date),
    MMM: get('month'),
    yyyy: get('year'),
    HH: get('hour'),
    mm: get('minute'),
    ss: get('second'),
    E: get('weekday'),
  }

  return format.replace(
    /yyyy|MMM|MM|dd|d|HH|mm|ss|E/g,
    (token) => map[token] ?? token
  )
}

export function formatRole(role: string): string {
  return role.replace(/_/g, ' ')
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1)
}