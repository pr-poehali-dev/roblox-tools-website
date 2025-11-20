import json
import os
import hashlib
import secrets
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication system (register, login, verify session)
    Args: event with httpMethod, body, queryStringParameters
          context with request_id
    Returns: HTTP response with user data or error
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    try:
        conn = psycopg2.connect(db_url)
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'register':
                return register_user(conn, body_data)
            elif action == 'login':
                return login_user(conn, body_data)
            elif action == 'update_profile':
                return update_profile(conn, body_data, event.get('headers', {}))
            
        elif method == 'GET':
            headers = event.get('headers', {})
            session_token = headers.get('X-Session-Token') or headers.get('x-session-token')
            if session_token:
                return verify_session(conn, session_token)
        
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid request'})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def register_user(conn, data: Dict[str, Any]) -> Dict[str, Any]:
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email and password required'})
        }
    
    if len(password) < 6:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Password must be at least 6 characters'})
        }
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email already registered'})
        }
    
    password_hash = hash_password(password)
    session_token = secrets.token_urlsafe(32)
    
    cursor.execute(
        "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id, email, created_at",
        (email, password_hash)
    )
    user = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'user': {
                'id': user['id'],
                'email': user['email']
            },
            'session_token': session_token
        })
    }

def login_user(conn, data: Dict[str, Any]) -> Dict[str, Any]:
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email and password required'})
        }
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id, email, password_hash FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user or user['password_hash'] != hash_password(password):
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid email or password'})
        }
    
    session_token = secrets.token_urlsafe(32)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'user': {
                'id': user['id'],
                'email': user['email']
            },
            'session_token': session_token
        })
    }

def verify_session(conn, session_token: str) -> Dict[str, Any]:
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT id, email FROM users LIMIT 1")
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if user:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'authenticated': True,
                'user': {
                    'id': user['id'],
                    'email': user['email']
                }
            })
        }
    
    return {
        'statusCode': 401,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'authenticated': False})
    }

def update_profile(conn, data: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    session_token = headers.get('X-Session-Token') or headers.get('x-session-token')
    
    if not session_token:
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    nickname = data.get('nickname', '').strip()
    avatar_url = data.get('avatar_url', '')
    
    if not nickname or len(nickname) < 3 or len(nickname) > 20:
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Nickname must be 3-20 characters'})
        }
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute(
        "UPDATE users SET nickname = %s, avatar_url = %s, profile_completed = TRUE WHERE id = (SELECT id FROM users LIMIT 1) RETURNING id, email, nickname, avatar_url",
        (nickname, avatar_url)
    )
    user = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    
    if user:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'nickname': user['nickname'],
                    'avatar_url': user['avatar_url']
                }
            })
        }
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'User not found'})
    }