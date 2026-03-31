'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

const NAV = [
  { href: '/dashboard', label: 'Pipeline', icon: '⬡' },
  { href: '/dashboard/agent', label: 'Agente IA', icon: '✦' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#09090f',color:'#f0f0f8',fontFamily:'system-ui,sans-serif'}}>
      <aside style={{width:'200px',background:'#0e0e18',borderRight:'1px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0}}>
        <div style={{padding:'20px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <span style={{color:'#7c6fff',marginRight:'8px'}}>✦</span>
          <span style={{fontWeight:800,letterSpacing:'3px'}}>VELOX</span>
        </div>
        <nav style={{padding:'12px 10px',display:'flex',flexDirection:'column',gap:'2px',flex:1}}>
          {NAV.map(item => (
            <Link key={item.href} href={item.href} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 10px',borderRadius:'8px',color:path===item.href?'#7c6fff':'#55556a',textDecoration:'none',fontSize:'13px',background:path===item.href?'rgba(124,111,255,0.12)':'transparent'}}>
              <span>{item.icon}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{padding:'12px 16px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          <UserButton />
        </div>
      </aside>
      <main style={{marginLeft:'200px',flex:1}}>{children}</main>
    </div>
  )
}
