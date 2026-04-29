export enum ButtonType {
  Submit = 'submit',
  Reset = 'reset',
  Button = 'button',
}

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'outlinesecondary'
  | 'outlinesuccess'
  | 'outlinewarning'
  | 'outlineinfo'
  | 'outlineerror'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'info'
  | 'error'
  | 'ghost'
  | 'ghostprimary'
  | 'ghostsecondary'
  | 'ghostsuccess'
  | 'ghostwarning'
  | 'ghosterror'
  | 'ghostinfo'
  | 'link'
  | 'lightprimary'
  | 'lightsecondary'
  | 'lightsuccess'
  | 'lightwarning'
  | 'lightinfo'
  | 'lighterror'

export enum ButtonSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export type ButtonT = {
  label: string
  name: string
  type: ButtonType
  variant?: ButtonVariant
  className?: string
  size?: ButtonSize
}
