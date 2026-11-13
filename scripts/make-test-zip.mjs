import JSZip from 'jszip';
import { writeFileSync } from 'node:fs';

const zip = new JSZip();
const folder = zip.folder('connections/followers_and_following');
const entry = (name) => ({ title: '', media_list_data: [], string_list_data: [{ href: 'https://www.instagram.com/' + name + '/', value: name, timestamp: 1700000000 }] });
folder.file('followers_1.json', JSON.stringify([entry('alice'), entry('bob'), entry('carol')]));
folder.file('following.json', JSON.stringify({ relationships_following: [entry('bob'), entry('carol'), entry('dave')] }));
const buf = await zip.generateAsync({ type: 'nodebuffer' });
writeFileSync('/tmp/ig-test.zip', buf);
console.log('wrote /tmp/ig-test.zip', buf.length, 'bytes');
