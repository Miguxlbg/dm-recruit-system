import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
export async function POST(request: NextRequest){
  const { employeeId, cycleId } = await request.json(); if(!employeeId||!cycleId) return NextResponse.json({error:'employeeId and cycleId required'},{status:400})
  const {data,error}=await getAdminClient().from('reviews').select('review_type,responses').eq('employee_id',employeeId).eq('cycle_id',cycleId).eq('status','submitted')
  if(error||!data?.length) return NextResponse.json({error:error?.message||'No submitted reviews found'},{status:400})
  const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY||''); const model=genAI.getGenerativeModel({model:'gemini-3.1-flash-lite'})
  const result=await model.generateContent(`Você é especialista de RH. Resuma em português as respostas 360 a seguir, separando pontos fortes, temas recorrentes e oportunidades de desenvolvimento. Seja objetivo e não invente dados.\n${JSON.stringify(data)}`)
  return NextResponse.json({summary:result.response.text()})
}
