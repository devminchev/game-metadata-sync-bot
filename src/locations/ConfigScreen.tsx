import React, { useCallback, useState, useEffect } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Flex,
  TextInput,
  FormControl,
  Select
} from '@contentful/f36-components';

interface AppInstallationParameters {
  externalSourceApiHost: string;
  secondaryExternalSourceApiHost?: string;
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [secondaryApiOptions, setSecondaryApiOptions] = useState<any[]>([]);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    externalSourceApiHost: sdk.parameters.installation.externalSourceApiHost || '',
    secondaryExternalSourceApiHost: sdk.parameters.installation.secondaryExternalSourceApiHost || '',
  });
  const [defaultParameterValues, setDefaultParameterValues] = useState<AppInstallationParameters>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    return {
      parameters,
      targetState: currentState
    };
  }, [parameters, sdk]);

  function updateParameters<T extends keyof AppInstallationParameters>(
    parameterName: T
  ) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value) {
        setParameters({ ...parameters, [parameterName]: value });
      } else {
        setParameters({ ...parameters, [parameterName]: '' });
      }
    };
  };

  const defaultInstallationParameters = async () => {
    const appDefinition = await sdk.cma.appDefinition.get({ appDefinitionId: sdk.ids.app });

    if (appDefinition.parameters?.installation?.length && appDefinition.parameters?.installation?.length > 0) {
      const defaultParams = appDefinition.parameters?.installation.reduce((acc: any, { id, default: def, type, options }) => {
        if (type === 'Enum' && options) {
          const formatted = options.map(option => {
            const [[value, label]] = Object.entries(option);
            return { label, value };
          });
          setSecondaryApiOptions(formatted);
        };
        acc[id] = def;
        return acc;
      }, {});

      return defaultParams;
    };

    return null;
  };

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const defaultParams = await defaultInstallationParameters();
      setDefaultParameterValues(defaultParams);

      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();
      if (currentParameters) {
        setParameters(currentParameters);
      };

      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex flexDirection="column" margin="spacingL">
      <Heading>Game Metadata Sync App Configurations</Heading>
      <Form>
        <FormControl isRequired isInvalid={!parameters.externalSourceApiHost} key="externalSourceApiHost">
          <FormControl.Label>Game MetadataExternal Source API Host (e.g, WhiteHat,Cabo...)</FormControl.Label>
          <TextInput
            name="externalSourceApiHost"
            value={parameters?.externalSourceApiHost}
            onChange={updateParameters('externalSourceApiHost')}
          />
          {defaultParameterValues?.secondaryExternalSourceApiHost &&
            <FormControl.HelpText>Default Config - {defaultParameterValues?.externalSourceApiHost}</FormControl.HelpText>
          }
        </FormControl>
        <FormControl key="secondaryExternalSourceApiHost">
          <FormControl.Label>Secondary External Source API Host</FormControl.Label>
          <Select
            id='secondaryExternalSourceApiHost'
            name='secondaryExternalSourceApiHost'
            value={parameters.secondaryExternalSourceApiHost}
            onChange={updateParameters('secondaryExternalSourceApiHost')}
          >
            <Select.Option key='none' value=''>
              None
            </Select.Option>
            {secondaryApiOptions.map((option) => (
              <Select.Option key={option.label} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
          {defaultParameterValues?.secondaryExternalSourceApiHost &&
            <FormControl.HelpText>Default Config - {secondaryApiOptions.find(o => o.value === defaultParameterValues?.secondaryExternalSourceApiHost)?.label}</FormControl.HelpText>
          }
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
