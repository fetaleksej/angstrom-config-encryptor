'use babel';

export default {
  config: {
    keysFile: {
      title: 'Keys file path',
      description: 'A full path and name a file contained keys.',
      type: 'string',
      default: '',
    },
    configFileName: {
      title: 'Config file name',
      description: 'Insert only file name of config file.',
      type: 'string',
      default: 'config.json',
    }
  }
};
