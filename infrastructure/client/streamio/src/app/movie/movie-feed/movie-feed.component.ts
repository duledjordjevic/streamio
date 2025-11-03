import { Component, inject } from '@angular/core';
import {  MovieDB } from '../model/movie.model';
import { MovieService } from 'src/app/movie-crud/service/movie-service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/service/AuthService';

@Component({
  selector: 'app-movie-feed',
  templateUrl: './movie-feed.component.html',
  styleUrls: ['./movie-feed.component.css']
})
export class MovieFeedComponent {

  fb = inject(FormBuilder);

  searchForm: FormGroup ;

  constructor(private movieService: MovieService, private authService: AuthService) {
    this.searchForm = this.fb.group({
      searchInput: ['']
    })
  }

  movies: MovieDB[] = [];
  searchText: string = "";


  ngOnInit(){ 
    if(this.authService.getUserRole() === 'Admin')  this.getMovies();
    else this.getFeed();
  }

  search() {
    if (this.searchForm.value.searchInput !== ''){
      this.getMovies(this.searchForm.value.searchInput);
    }else{
      if(this.authService.getUserRole() === 'Admin')  this.getMovies();
      else this.getFeed();
    }
  }
  
  getMovies(query?: string){
    this.movieService.getAllMovies(query).subscribe({
      next: result => {
        this.movies = result;
      }
    })
  }

  getFeed(){
    this.movieService.getFeed(this.authService.getUsername()!).subscribe({
      next: result => {
        this.movies = result;
      }
    })
  }

}
