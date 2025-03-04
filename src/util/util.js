import { utf8ByteArrayToString } from 'utf8-string-bytes';
import { Opcode } from 'java-class-tools';

export function getAttribute(classFile, source, attributeName) {
    const { attributes } = source;
    return attributes.find(attr => utf8ByteArrayToString(classFile.constant_pool[attr.attribute_name_index].bytes) === attributeName);
}

export function getInstructionLineNumber(classFile, method, instruction) {
    const codeAttr = getAttribute(classFile, method, 'Code');
    const lineNumberTable = getAttribute(classFile, codeAttr, 'LineNumberTable');
    const { bytecodeOffset } = instruction;
    if (lineNumberTable) {
        for (let i = 0; i < lineNumberTable.line_number_table_length - 1; i++) {
            const { start_pc, line_number } = lineNumberTable.line_number_table[i];
            const end_pc = lineNumberTable.line_number_table[i + 1].start_pc;
            if (bytecodeOffset >= start_pc && bytecodeOffset <= end_pc) return line_number;
        }
    }
    return undefined;
}

export function extractClassName(index, constant_pool) {
    return getUtf8String(constant_pool, constant_pool[index].name_index);
}

export function extractMethodInfoConstants(methodInfo, constant_pool) {
    return {
        name: getUtf8String(constant_pool, methodInfo.name_index),
        descriptor: getUtf8String(constant_pool, methodInfo.descriptor_index),
    };
}

export function getUtf8String(constant_pool, index) {
    let poolEntry = constant_pool[index];
    if (poolEntry.tag === 8) poolEntry = constant_pool[poolEntry.string_index];
    return utf8ByteArrayToString(poolEntry.bytes);
}

export function getStringContext(constantPool, instructions, index) {
    const nextInstruction = instructions[index + 1];
    if (nextInstruction?.opcode === Opcode.INVOKEINTERFACE) {
        const index = (nextInstruction.operands[0] << 8) | nextInstruction.operands[1];
        const methodRef = constantPool[index];
        const className = extractClassName(methodRef.class_index, constantPool);
        const { name, descriptor } = extractMethodInfoConstants(methodRef.name_and_type_index, constantPool);
        const fullMethodDesc = `${className}#${name}${descriptor}`;
        switch (fullMethodDesc) {
            case 'org/bukkit/command/CommandSender#sendMessage(Ljava/lang/String;)V':
            case 'org/bukkit/entity/Player#sendMessage(Ljava/lang/String;)V':
                return 'SendMessage';
            case 'org/bukkit/inventory/meta/ItemMeta#setDisplayName(Ljava/lang/String;)V':
                return 'ItemDisplayName';
            default:
                return undefined;
        }
    }
}