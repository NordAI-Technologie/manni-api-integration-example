import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    
    const apiEndpoint = request.headers.get('x-api-endpoint') || process.env.API_ENDPOINT;
    const apiKey = request.headers.get('x-api-key') || process.env.API_KEY;
    
    if (!apiEndpoint || !apiKey) {
      return NextResponse.json({ error: 'API configuration missing' }, { status: 400 });
    }
    
    const apiUrl = `${apiEndpoint}/api/${path}`;
    console.log(`Proxying GET request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.warn(`Status check failed with status ${response.status}`);
      return NextResponse.json({
        status: 'pending',
        message: 'Status check temporarily unavailable, continuing to poll'
      });
    }
    
    const data = await response.json();
    
    if (data.status === 'processing' && data.progress === undefined) {
      const fileId = path.split('/')[1];
      const timestamp = Math.floor(Date.now() / 30000);
      const progressSeed = fileId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const randomFactor = ((progressSeed + timestamp) % 10) / 10;
      
      const startTime = (global as any)[`start_time_${fileId}`] || ((global as any)[`start_time_${fileId}`] = Date.now());
      const elapsedMinutes = (Date.now() - startTime) / (60 * 1000);

      let progress;
      if (elapsedMinutes < 2) {
        progress = (elapsedMinutes / 2) * 30;
      } else if (elapsedMinutes < 7) {
        progress = 30 + ((elapsedMinutes - 2) / 5) * 40;
      } else {
        progress = 70 + ((elapsedMinutes - 7) / 10) * 25;
      }
      
      progress = Math.min(95, progress) * (0.95 + randomFactor * 0.1);
      data.progress = Math.round(progress);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in proxy (GET):', error);
    return NextResponse.json({
      status: 'pending',
      message: 'Status check temporarily unavailable, continuing to poll'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    
    // Get API configuration from request headers
    const apiEndpoint = request.headers.get('x-api-endpoint') || process.env.API_ENDPOINT;
    const apiKey = request.headers.get('x-api-key') || process.env.API_KEY;
    
    if (!apiEndpoint || !apiKey) {
      return NextResponse.json({ error: 'API configuration missing' }, { status: 400 });
    }
    
    console.log(`Proxying POST request to: ${path}`);
    
    if (path === 'upload') {
      const formData = await request.formData();
      const file = formData.get('file');
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      
      const apiUrl = `${apiEndpoint}/api/upload`;
      console.log(`Uploading file to ${apiUrl}`);
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const uploadResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
        },
        body: uploadFormData,
        signal: AbortSignal.timeout(60000), // 60-second timeout
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`);
        return NextResponse.json({ error: 'Upload failed' }, { status: uploadResponse.status });
      }
      
      const uploadData = await uploadResponse.json();
      return NextResponse.json(uploadData);
    }
    
    if (path.startsWith('transcribe/')) {
      try {
        const body = await request.json();
        const fileId = path.split('/')[1];
        
        const apiUrl = `${apiEndpoint}/api/transcribe/${fileId}`;
        console.log(`Starting transcription for ${fileId}`);
        
        (global as any)[`start_time_${fileId}`] = Date.now();
        
        fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            language: body.language || null
          }),
        }).catch(err => {
          console.error('Error starting transcription:', err);
        });
        
        return NextResponse.json({
          status: 'processing',
          message: 'Transcription started',
          file_id: fileId
        });
      } catch (error) {
        console.error('Error parsing transcription request:', error);
        return NextResponse.json({
          status: 'processing',
          message: 'Transcription may have started with errors, polling for status',
          file_id: path.split('/')[1]
        });
      }
    }
    
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  } catch (error) {
    console.error('Error in proxy (POST):', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}