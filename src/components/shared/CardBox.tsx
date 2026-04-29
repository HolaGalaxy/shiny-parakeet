'use client'

import { Card } from '@/components/ui/card'

interface CardBoxProps {
  children: React.ReactNode
  className?: string
}

const CardBox: React.FC<CardBoxProps> = ({ children, className }) => {
  return (
    <Card className={`card bg-background ${className}`}>
      {children}
    </Card>
  )
}

export default CardBox;