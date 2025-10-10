import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const adminToken = req.headers.get('x-admin-token');

  return NextResponse.json({
    authHeader: authHeader ? authHeader.substring(0, 20) + '...' : null,
    adminTokenHeader: adminToken ? adminToken.substring(0, 20) + '...' : null,
    isAdminRequest: isAdminRequest(req),
    envToken: process.env.ADMIN_TOKEN ? process.env.ADMIN_TOKEN.substring(0, 10) + '...' : null,
    envTokenLength: process.env.ADMIN_TOKEN?.length || 0
  });
}