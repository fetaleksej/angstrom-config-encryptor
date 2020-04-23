'use babel';

import NodeRSA from 'node-rsa'
import NodeCrypto from 'crypto'
import { config as UserConfigs } from './config'
import { File } from 'atom'
import { dirname, basename } from 'path'
import fs from 'fs'

export default {
  config: UserConfigs,

  activate(state) {
    atom.commands.add('atom-workspace', {
      'angstrom-config-encryptor:encrypt': () => this.encrypt()
    });
  },

  deactivate() {},

  serialize() { return {} },

  async encrypt() {
    const currentTextEditor = atom.workspace.getActiveTextEditor()
    if (currentTextEditor === undefined) {
      return;
    }

    const currentPath = currentTextEditor.getPath()
    if (currentPath === undefined) {
      atom.notifications.addError('Please save file before start encrypting')
      return
    }

    const configFileName = basename(
      atom.config.get('angstrom-config-encryptor.configFileName'))
    if (configFileName === '') {
      atom.notifications.addError('Please input correct file name of config file')
      return
    }

    const fileName = atom.config.get('angstrom-config-encryptor.keysFile')
    const hexcipherRSA = await (new File(fileName)).read(false)
    if (hexcipherRSA === null) {
      atom.notifications.addError(`File "${fileName}" is not exist`)
    }

    const encryptedConfig = encryptConfig(currentTextEditor.getText(), hexcipherRSA)
    const storeConfigPath = dirname(currentPath) + '/' + configFileName

    fs.writeFile(storeConfigPath, encryptedConfig, 'binary', () => {
      atom.notifications.addInfo(
        `Encrypted config file is saved to ${storeConfigPath}.`)
    })
  }
};


function encryptConfig(configContext, hexCipherRSA)  {
  const generateRandomByteArray = (count) => Buffer.alloc(count).map(
    () => Math.floor(Math.random() * 256))

  const keyAES = generateRandomByteArray(32)
  const initVector = generateRandomByteArray(16)

  const cipherAES = NodeCrypto.createCipheriv('aes-256-cfb', keyAES, initVector)
  let encryptedContext = cipherAES.update(Buffer.from(configContext));
  encryptedContext = Buffer.concat([encryptedContext, cipherAES.final()]);

  const cipherRSA = new NodeRSA();
  cipherRSA.importKey(Buffer.from(hexCipherRSA.trim(), 'hex'), 'pkcs8-public-der')
  const hexKeyAndInitVector = Buffer.concat(
    [Buffer.from(keyAES), Buffer.from(initVector)]).toString('hex')
  const encryptedKey = Buffer.from(
    cipherRSA.encrypt(hexKeyAndInitVector, 'hex'), 'hex')

  return Buffer.concat([encryptedKey, encryptedContext])
}
