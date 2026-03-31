'use client'
import { useState } from 'react'
const S=[{id:'PROSPECTO',l:'Prospecto',c:'#55556a'},{id:'LEAD',l:'Lead',c:'#60a5fa'},{id:'OPORTUNIDAD',l:'Oportunidad',c:'#818cf8'},{id:'PROPUESTA',l:'Propuesta',c:'#a78bfa'},{id:'FORECAST',l:'Forecast',c:'#f59e0b'},{id:'ORDEN',l:'Orden de Compra',c:'#22d3a0'}]
const fmt=n=>new Intl.NumberFormat('es',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n)
const D=[{id:'1',name:'CRM TechCorp',value:18000,stage:'PROPUESTA',daysInStage:3,contact:{company:'TechCorp SA'}},{id:'2',name:'Consultoria Q2',value:45000,stage:'FORECAST',daysInStage:2,contact:{company:'Grupo Familia'}},{id:'3',name:'Licencia Premium',value:12000,stage:'LEAD',daysInStage:1,contact:{company:'Distribuidora Norte'}},{id:'4',name:'Expansion Regional',value:85000,stage:'OPORTUNIDAD',daysInStage:5,contact:{company:'Inversiones Sur'}}]
export default function DashboardPage(){
const[deals,setDeals]=useState(D)
const[dragOver,setDragOver]=useState(null)
const pipeline=deals.reduce((s,d)=>s+d.value,0)
const drop=(sid,e)=>{const id=e.dataTransfer.getData('dealId');setDeals(p=>p.map(d=>d.id===id?{...d,stage:sid}:d));setDragOver(null)}
return(
<div style={{padding:'28px',minHeight:'100vh',background:'#09090f',color:'#f0f0f8',fontFamily:'system-ui,sans-serif'}}>
<h1 style={{fontSize:'22px',fontWeight:800,marginBottom:'8px'}}>Pipeline</h1>
<div style={{fontSize:'12px',color:'#55556a',marginBottom:'24px'}}>{deals.length} deals · {fmt(pipeline)}</div>
<div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'10px'}}>
{S.map(s=>{const sd=deals.filter(d=>d.stage===s.id);return(
<div key={s.id} style={{background:'#13131f',border:'1px solid '+(dragOver===s.id?'#7c6fff':'rgba(255,255,255,0.07)'),borderRadius:'12px',minHeight:'200px'}} onDragOver={e=>{e.preventDefault();setDragOver(s.id)}} onDragLeave={()=>setDragOver(null)} onDrop={e=>drop(s.id,e)}>
<div style={{padding:'10px 12px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:'6px'}}>
<div style={{width:'7px',height:'7px',borderRadius:'50%',background:s.c}}/><span style={{fontSize:'11px',fontWeight:600,color:'#9999b8'}}>{s.l}</span><span style={{fontSize:'10px',color:'#55556a',marginLeft:'auto'}}>{sd.length}</span>
</div>
<div style={{padding:'8px',display:'flex',flexDirection:'column',gap:'6px'}}>
{sd.length===0?<div style={{fontSize:'11px',color:'#55556a',textAlign:'center',padding:'20px',border:'1px dashed rgba(255,255,255,0.07)',borderRadius:'8px'}}>Arrastra aquí</div>:sd.map(d=>(
<div key={d.id} draggable onDragStart={e=>e.dataTransfer.setData('dealId',d.id)} style={{background:'#1a1a28',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'10px',cursor:'grab'}}>
<div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontSize:'12px',fontWeight:600}}>{d.name}</span><span style={{fontSize:'11px',color:'#9999b8'}}>{fmt(d.value)}</span></div>
<div style={{fontSize:'11px',color:'#55556a'}}>{d.contact.company}</div>
<div style={{fontSize:'10px',color:'#55556a',marginTop:'4px'}}>{d.daysInStage}d</div>
</div>
))}
</div>
</div>
)})}
</div>
</div>
)
}
