
export async function comparePasswords(plainPassword, hashedPassword) {
  if (process.env.NEXT_RUNTIME === 'edge') {
    const [salt, key] = hashedPassword.split(':');
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(plainPassword),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: Buffer.from(salt, 'hex'),
        iterations: 310000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    return Buffer.from(derivedKey).toString('hex') === key;
  } else {
    const { compare } = await import('bcryptjs');
    return compare(plainPassword, hashedPassword);
  }
}