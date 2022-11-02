function parseCommand(params, argString = '') {
  argString = argString || process.argv.slice(2).join(' ');

  if (!Array.isArray(params)) {
    params = Object.keys(params).map(key => {;
      let param = params[key];
      param.name = key;
      return param;
    });
  }

  const aliasRegex = /(?<str>-(?<key>\w*)\s(?<value>\S*))/g;
  const optionRegex = /(?<str>--(?<key>\w*)\="?(?<value>\s?\S*)"?)/g;
  const flagRegex = /(?<str>-(?<key>\w+))/g;

  const object = getRegexMatchesAsObject(argString, [aliasRegex, optionRegex, flagRegex], params);
  const otherArgs = getOtherArgs(object.argString, params);

  const opts = {
    ...object.results,
    args: otherArgs
  };

  for (let param of params) {
    if (typeof opts[param.name] !== 'undefined') {
      if (param.action) {
        param.action(params, opts);
      }
    }
  }

  return opts;
}

function getOtherArgs(argString) {
  const otherArgsRegex = /(?<str>\S+)/g;
  const otherArgs = [...argString.matchAll(otherArgsRegex)];
  return otherArgs.reduce((acc, otherArg) => {
    const { str } = otherArg.groups;
    argString = argString.replace(str, '');
    acc.push(str);
    return acc;
  }, []);
}

function getRegexMatchesAsObject(argString, regexes, params) {
  const results = regexes.reduce((acc, regex) => {
    const optionRegex = regex;
    let options = [...argString.matchAll(optionRegex)];

    const result = options.reduce((acc, option) => {
      let { key, value, str } = option.groups;
      const matching = params.find(param => param.name === key || param.alias === key);
      let name = key;

      if (matching) {
        name = matching.name;
      }

      let cast = (value) => value;
      if (matching) {
        cast = matching.type;
      }

      argString = argString.replace(str, '');

      if (!value) {
        key = key.split('');
        for (let k of key) {
          const matching = params.find(param => param.alias === k);
          name = k
          if (matching) {
            name = matching.name;
          }
          acc[name] = cast(true);
        }
        return acc;
      }

      acc[name] = cast(value);
      return acc;
    }, {});

    return { ...acc, ...result };
  }, {});

  return {
    results,
    argString
  };
}

module.exports = parseCommand;
