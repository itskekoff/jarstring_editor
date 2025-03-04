import mitt from 'mitt';
import {JavaClassFileReader, InstructionParser, Opcode, ConstantType, Modifier} from 'java-class-tools';
import {getAttribute, getUtf8String} from './util';

export class StringSearcher {
    constructor() {
        this.emitter = mitt();
        this._classReader = new JavaClassFileReader();
        this._result = [];
    }

    on(event, handler) {
        this.emitter.on(event, handler);
    }

    async searchInJar(jar) {
        const classes = jar.filter(path => path.endsWith('.class'));
        for (let i = 0; i < classes.length; i++) {
            const classFile = classes[i];
            const classData = await classFile.async('arraybuffer');
            try {
                this.searchInClass(classFile.name, classData);
            } catch (e) {
                console.error(`Failed to search in class "${classFile.name}"`);
                console.error(e);
            }
            if (i % 100 === 0) this.emitter.emit('read_count', i + 1);
        }
        this.emitter.emit('finish', this._result);
        return this._result;
    }

    searchInClass(fileName, classData) {
        const classFile = this._classReader.read(classData);
        const constantPool = classFile.constant_pool;
        const alreadyMappedStrings = new Set();

        const stringsByMethod = classFile.methods
            .filter(method => (method.access_flags & Modifier.ABSTRACT) === 0)
            .map(method => {
                const codeAttribute = getAttribute(classFile, method, 'Code');
                if (!codeAttribute) return undefined;

                const instructions = InstructionParser.fromBytecode(codeAttribute.code);
                const stringsInThisMethod = [];

                for (let i = 0; i < instructions.length; i++) {
                    const {opcode, operands} = instructions[i];
                    if (opcode !== Opcode.LDC && opcode !== Opcode.LDC_W) continue;

                    const constantIndex = opcode === Opcode.LDC ? operands[0] : (operands[0] << 8) | operands[1];
                    const constantEntry = constantPool[constantIndex];
                    if (constantEntry.tag !== ConstantType.STRING || alreadyMappedStrings.has(constantIndex)) continue;

                    stringsInThisMethod.push({
                        constantIndex,
                        instruction: instructions[i],
                        value: getUtf8String(constantPool, constantIndex),
                        instructionIndex: i,
                    });
                    alreadyMappedStrings.add(constantIndex);
                }
                return {method, instructions, strings: stringsInThisMethod};
            })
            .filter(m => m && m.strings.length > 0);

        if (stringsByMethod.length > 0) {
            this._result.push({classFile, fileName, methods: stringsByMethod});
        }
    }
}