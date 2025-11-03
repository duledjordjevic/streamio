import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
import { AuthService } from 'src/app/auth/service/AuthService';
import { MovieDB, TopicArn, UserSubscriptions } from 'src/app/movie/model/movie.model';
import { ConfigService } from 'src/app/service/config.service';

@Injectable({
  providedIn: 'root'
})
export class MovieService implements OnInit{
    private environment: any;

    constructor(private http: HttpClient, private authService: AuthService, private configService: ConfigService) {

    }
    ngOnInit(): void {
        this.environment = this.configService.getConfig();
    }

    headers = new HttpHeaders({
        skip: 'true'
    });


    getUploadUrl(movieName: string, uuid: string, resolution: string, title: string,
        description: string, actors: string, directors: string, genres: string, thumbnail: string): Observable<any>{
		

        let body = {
            'movie_name' : movieName,
            'uuid' : uuid,
            'resolution' : resolution,
            'description' :  description,
            'actors' : actors,
            'directors': directors,
            'genres' : genres,
            'thumbnail' : thumbnail
        }

        const url =  this.environment.API + `/upload-url`;
		return this.http.post<any>(url, body, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        });
	}


    getMovieByName(movieName: string): Observable<MovieDB[]>{
        let params = new HttpParams()
            .set('movie_name', movieName);

        const url = this.environment.API + `/get-movie`;
        return this.http.get<MovieDB[]>(url, { params });
    }

    getPreviewUrl(movie: string, uuid: string, resolution: string) {
        let params = new HttpParams()
            .set('movie_name', movie)
            .set('uuid', uuid)
            .set('resolution', resolution)
            .set('user', this.authService.getUsername()!);
        
        const url = this.environment.API + `/preview-url`;
        return this.http.get<any>(url, { params });
    }

    getDownloadUrl(movie: string, uuid: string, resolution: string) {
        let params = new HttpParams()
            .set('movie_name', movie)
            .set('uuid', uuid)
            .set('resolution', resolution)
            .set('user', this.authService.getUsername()!);
        
        const url = this.environment.API + `/download-url`;
        return this.http.get<any>(url, { params });
    }

    deleteMovie(movieName: string) {
        let params = new HttpParams()
            .set('directory', movieName);

        const url = this.environment.API + `/delete-movie`;
        return this.http.delete<any>(url, { params });
    }

    getAllMovies(query?: string){
        let params = new HttpParams();
        if(query){
            params = params.set('query', query);
        }

        const url = this.environment.API + `/movies`;
        return this.http.get<MovieDB[]>(url, { params });
    }

    updateMovie(movieName: string,  resolution: string, title: string,
        description: string, actors: string, directors: string, genres: string, thumbnail: string){

        let body = {
            'directory' : movieName,
            'resolution' : resolution,
            'title': title, 
            'description' :  description,
            'actors' : actors,
            'directors': directors,
            'genres' : genres,
            'thumbnail' : thumbnail
        }
        
        const url = this.environment + `/put-movie`;
        return this.http.put<any>(url, body, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        });
    }

    isLiked(username:string, movieName: string){
        let params = new HttpParams()
            .set('userId', username)
            .set('directory', movieName);

        const url = this.environment.API + `/get-like`;
        return this.http.get<any>(url, { params });
    }

    postLike(username:string, movieName:string, liked: boolean){
        let body = {
            "userId": username, 
            "directory": movieName, 
            "liked": liked
        }

        const url = this.environment.API + `/post-like`;
        return this.http.post<any>(url, body, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        });
    }

    deleteLike(username: string, movieName: string){
        let params = new HttpParams()
        .set('userId', username)
        .set('directory', movieName);

        const url = this.environment.API + `/delete-like`;
        return this.http.delete<any>(url, { params });
    }

    getTopics(){
        const url = this.environment.API + `/get-topics`;
        return this.http.get<TopicArn[]>(url);
    }

    getSubscriptions(username: string){
        let params = new HttpParams()
        .set('userId', username);

        const url = this.environment.API + `/get-subscription`;
        return this.http.get<UserSubscriptions>(url, { params });
    }

    postSubscription(username: string, email: string, topics: string[]){
        let body = {
            "userId": username, 
            "email": email,
            "topics": topics, 
        }

        const url = this.environment.API + `/post-subscription`;
        return this.http.post<any>(url, body, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        });
    }

    putSubscription(username: string, email: string, topics: string[]){
        let body = {
            "userId": username, 
            "email": email,
            "topics": topics, 
        }

        const url = this.environment.API + `/put-subscription`;
        return this.http.put<any>(url, body, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        });
    }

    getFeed(username: string){
        let params = new HttpParams()
        .set('userId', username);

        const url = this.environment.API + `/get-feed`;
        return this.http.get<MovieDB[]>(url, { params });
    }

}
