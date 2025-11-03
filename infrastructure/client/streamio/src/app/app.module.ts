import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Amplify } from 'aws-amplify';
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { Interceptor } from 'src/app/auth/interceptor';
import { MovieCrudModule } from './movie-crud/movie-crud.module';
import { LayoutModule } from './layout/layout.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MovieModule } from './movie/movie.module';
import { SharedModule } from './shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';


Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-central-1_lOu2AS24O',
      userPoolClientId: '5bs5fv8vqsjqct8sfddb5miq1v'
    }
  }
});

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AmplifyAuthenticatorModule,
    HttpClientModule,
    MovieCrudModule,
    LayoutModule,
    BrowserAnimationsModule,
    MovieModule,
    SharedModule,
    ReactiveFormsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: Interceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
