'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

type Props = { asLink?: boolean }

const LogoImages = () => (
  <>
    <Image
      src='/images/logos/loom-switch-dark-logo.svg'
      alt='logo'
      width={152}
      height={36}
      className='block dark:hidden rtl:scale-x-[-1]'
    />
    <Image
      src='/images/logos/loom-switch-light-logo.svg'
      alt='logo'
      width={152}
      height={36}
      className='hidden dark:block rtl:scale-x-[-1]'
    />
  </>
)

const FullLogo = ({ asLink = true }: Props) => {
  if (!asLink) return <LogoImages />

  return (
    <Link href={ROUTES.DASHBOARD}>
      <LogoImages />
    </Link>
  )
}

export default FullLogo
