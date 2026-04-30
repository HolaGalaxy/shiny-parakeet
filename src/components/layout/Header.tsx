'use client'

import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Icon } from '@iconify/react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import FullLogo from './FullLogo'
import SidebarLayout from './Sidebar'
import Notifications from './Notifications'
import Profile from './Profile'
import { useSession } from '@/lib/auth/use-session'

const Header = () => {
  const { theme, setTheme } = useTheme()
  const { user } = useSession()
  const [isSticky, setIsSticky] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMode = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <>
      <header className={`sticky top-0 z-2 ${isSticky ? 'bg-background shadow-md fixed w-full' : 'bg-transparent'}`}>
        <nav className='rounded-none py-4 sm:ps-6 max-w-full! sm:pe-10 dark:bg-dark flex justify-between items-center px-6'>
          <div
            onClick={() => setIsOpen(true)}
            className='px-3.5 hover:text-primary dark:hover:text-primary text-link dark:text-darklink relative after:absolute after:w-10 after:h-10 after:rounded-full hover:after:bg-lightprimary after:bg-transparent rounded-full xl:hidden flex justify-center items-center cursor-pointer'
          >
            <Icon icon='tabler:menu-2' height={20} width={20} />
          </div>

          <div className='block xl:hidden'>
            <FullLogo />
          </div>

          <div className='flex xl:hidden items-center'>
            <div className='hover:text-primary px-2 md:px-15 group focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-gray relative' onClick={toggleMode}>
              <span className='flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-lightprimary'>
                {theme === 'light' ? <Icon icon='tabler:moon' width='20' /> : <Icon icon='solar:sun-bold-duotone' width='20' className='group-hover:text-primary' />}
              </span>
            </div>
            <div className='xl:block'>
              <div className='flex gap-0 items-center relative'>
                <Notifications />
              </div>
            </div>
            <Profile />
          </div>

          <div className='hidden xl:flex items-center justify-between w-full'>
            {/* <div className='flex items-center gap-2'>
              <div className='relative'>
                <Icon icon='solar:magnifer-linear' width={18} height={18} className='absolute left-3 top-1/2 -translate-y-1/2' />
                <Input type='text' placeholder='Search...' className='rounded-xl pl-10' />
              </div>
            </div> */}
            <div className='flex w-full justify-end items-end'>
              <div className='flex gap-0 items-center'>
                <div className='hover:text-primary px-15 group focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-gray relative' onClick={toggleMode}>
                  <span className='flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-lightprimary'>
                    {theme === 'light' ? <Icon icon='tabler:moon' width='20' /> : <Icon icon='solar:sun-bold-duotone' width='20' className='group-hover:text-primary' />}
                  </span>
                </div>
                {/* <div className='xl:block'>
                  <div className='flex gap-0 items-center relative'>
                    <Notifications />
                  </div>
                </div> */}
                <Profile />
              </div>
            </div>
          </div>
        </nav>
      </header>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side='left' className='w-[270px] p-0'>
          <VisuallyHidden><SheetTitle>sidebar</SheetTitle></VisuallyHidden>
          <SidebarLayout onClose={() => setIsOpen(false)} userRole={user?.role} />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default Header
