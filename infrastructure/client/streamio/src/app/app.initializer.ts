import { HttpClient } from '@angular/common/http';
import { ConfigService } from './service/config.service';
import { Amplify } from 'aws-amplify';

const DEFAULT_CONFIG = {
  API: 'http://localhost:4200',
  USER_POOL_ID: 'eu-central-1_aaaaaa',
  USER_POOL_CLIENT_ID: 'xxxxxxxxxxxxxxxxxxxxxxxxxxx',
  STAGE: 'dev'
};

export function initializeApp(http: HttpClient, configService: ConfigService) {
  return (): Promise<void> => {
    return http.get('/config.json')
      .toPromise()
      .then((config: any) => {
        configService.setConfig(config);
        console.log('Config loaded:', config);

        Amplify.configure({
          Auth: {
            Cognito: {
              userPoolId: config.USER_POOL_ID,
              userPoolClientId: config.USER_POOL_CLIENT_ID
            }
          }
        });
        console.log('Amplify configured');
        
      })
      .catch(err => {
        console.warn('Failed to load config.json, using defaults:', err);
        configService.setConfig(DEFAULT_CONFIG);
        
        Amplify.configure({
          Auth: {
            Cognito: {
              userPoolId: DEFAULT_CONFIG.USER_POOL_ID,
              userPoolClientId: DEFAULT_CONFIG.USER_POOL_CLIENT_ID
            }
          }
        });
      });
  };
}
