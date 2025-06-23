
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable ISR

export async function GET(req, { params }) {
  const { path } = await params; // Await params
  return handleProxy(req, path);
}

export async function POST(req, { params }) {
  const { path } = await params; // Await params
  return handleProxy(req, path);
}

export async function PUT(req, { params }) {
  const { path } = await params; // Await params
  return handleProxy(req, path);
}

export async function DELETE(req, { params }) {
  const { path } = await params; // Await params
  return handleProxy(req, path);
}

async function handleProxy(req, pathSegments) {
  const targetURL = `http://192.168.1.127:8080/${pathSegments.join('/')}`;

  try {
    const method = req.method;
    const headers = new Headers(req.headers);
    headers.set('Host', '192.168.1.127:8080');

    if (req.headers.get('cookie')) {
      headers.set('cookie', req.headers.get('cookie'));
    }

    const fetchOptions = {
      method,
      headers,
      redirect: 'manual',
    };

    if (method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = req.body;
      fetchOptions.duplex = 'half';
    }

    const res = await fetch(targetURL, fetchOptions);

    const contentType = res.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? JSON.stringify(await res.json())
      : await res.text();

    const responseHeaders = new Headers({
      'content-type': contentType,
    });

    // 🔥 Forward Set-Cookie header manually
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie);
    }

    return new NextResponse(body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy failed', message: error.message },
      { status: 500 }
    );
  }
}

