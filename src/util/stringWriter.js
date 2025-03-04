import { stringToUtf8ByteArray } from 'utf8-string-bytes';
import { JavaClassFileReader, JavaClassFileWriter } from 'java-class-tools';

export class StringWriter {
    static async write(jar, strings) {
        const classWriter = new JavaClassFileWriter();
        const classReader = new JavaClassFileReader();
        const classFileMap = new Map();
        const filePromises = [];

        for (const { constantIndex, changed, fileName, value } of strings) {
            if (!changed) continue;

            let classFilePromise = classFileMap.get(fileName) || jar.file(fileName).async('arraybuffer').then(buf => classReader.read(buf));
            classFileMap.set(fileName, classFilePromise);

            filePromises.push(classFilePromise.then(classFile => {
                const stringBytes = stringToUtf8ByteArray(value);
                const utf8Entry = classFile.constant_pool[classFile.constant_pool[constantIndex].string_index];
                utf8Entry.length = stringBytes.length;
                utf8Entry.bytes = stringBytes;
                jar.file(fileName, classWriter.write(classFile).buffer);
            }));
        }

        await Promise.all(filePromises);
        return jar.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    }
}