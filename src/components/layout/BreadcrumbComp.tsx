'use client'

import CardBox from '@/components/shared/CardBox'
import React from 'react'
import Link from 'next/link'

export interface IBreadcrumbItem {
  title: string
  to?: string
}

interface BreadCrumbProps {
  items?: IBreadcrumbItem[]
  title: string
}

const BreadcrumbComp = ({ items, title }: BreadCrumbProps) => {
  return (
    <CardBox
      className={`mb-6 py-4 bg-lightinfo dark:bg-darkinfo overflow-hidden rounded-3xl border-none !shadow-none dark:!shadow-none`}>
      <div className=' items-center grid grid-cols-12 gap-6'>
        <div className='col-span-10'>
          <h4 className='font-semibold text-xl text-customdark mb-3'>
            {title}
          </h4>
          <ol
            className='flex items-center whitespace-nowrap'
            aria-label='Breadcrumb'>

            {items?.map((item, index) => (
              <React.Fragment key={index}>
                <li className='flex items-center'>
                  {item.to ? (
                    <Link
                      href={item.to}
                      className='opacity-80 text-sm text-charcoal hover:opacity-100 transition-opacity leading-none'>
                      {item.title}
                    </Link>
                  ) : (
                    <span className='opacity-80 text-sm text-charcoal leading-none'>
                      {item.title}
                    </span>
                  )}
                </li>
                <li>
                  <div className='p-0.5 rounded-full bg-dark dark:bg-darklink mx-2.5 flex items-center'></div>
                </li>
              </React.Fragment>
            ))}
            <li
              className='flex items-center text-sm text-charcoal font-medium leading-none'
              aria-current='page'>
              {title}
            </li>
          </ol>
        </div>
      </div>
    </CardBox>
  )
}

export default BreadcrumbComp


