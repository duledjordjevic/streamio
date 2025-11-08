import { Component, OnInit } from '@angular/core';
import { MovieService } from '../service/movie-service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxImageCompressService } from 'ngx-image-compress';

@Component({
  selector: 'app-update-movie',
  templateUrl: './update-movie.component.html',
  styleUrls: ['./update-movie.component.css']
})
export class UpdateMovieComponent implements OnInit {

  movieName: string = "";
  resolution: string = "";

  constructor(private movieService: MovieService, private route: ActivatedRoute,
     private router: Router, private imageCompress: NgxImageCompressService) {}

  ngOnInit(){
    this.route.queryParams.subscribe(params => {
      this.movieName = params['movieName'];
      this.movieTitle = params['movieName'].split('-')[0];
    });
    this.movieService.getMovieByName(this.movieName).subscribe({
      next: result => {
        console.log(result)
          result.forEach(element => {
            if(element.thumbnail){
              console.log("asdsa")
              this.movieDescription = element.description?.S!;
              this.actors = element.actors?.S.split(',')!;
              this.directors = element.directors?.S.split(',')!;
              this.genres = element.genres?.S.split(',')!;
              this.resolution = element.resolution?.S!;
              this.selectedThumbnail = this.movieTitle + " - " + "old thumbnail";
              this.isThumbnailSelected = true;
              this.base64String = element.thumbnail?.S!; 
            }
          })
      }
    })
  }

  isThumbnailSelected: boolean = false;
  selectedThumbnail: string = "";
  selectedThumbnailFile: File | null = null;

  base64String: string = "";


  movieTitle: string = "";
  movieDescription: string = "";
  newActor: string = "";
  actors: string[] = [];
  newDirector: string = "";
  directors: string[] = [];
  selectedGenre: string = "";
  genres: string[] = [];

  predefinedGenres: string[] = ["Action", "Comedy", "Thriller", "Drama", "Horror", "Sci-Fi", "Romance", "Crime"];

  onThumbnailSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedThumbnailFile = file;
      this.isThumbnailSelected = true;
      this.selectedThumbnail = file.name;

      this.convertFileToBase64(this.selectedThumbnailFile!)
        .then(base64String => {
          this.base64String = base64String;
        })
        .catch(error => {
          console.error('Error converting file to Base64:', error);
        });

    }else{
      this.selectedThumbnailFile = null;
      this.isThumbnailSelected = false;
      this.selectedThumbnail = "";
      console.error('Selected file is not a image.');
    }
  }


  addToList(listType: string) {
    switch(listType) {
      case 'actors':
        if (this.newActor.trim()) {
          this.actors.push(this.newActor.trim());
          this.newActor = '';
        }
        break;
      case 'directors':
        if (this.newDirector.trim()) {
          this.directors.push(this.newDirector.trim());
          this.newDirector = '';
        }
        break;
      case 'genres':
        if (this.selectedGenre && !this.genres.includes(this.selectedGenre)) {
          this.genres.push(this.selectedGenre);
          this.selectedGenre = this.predefinedGenres[0]; 
        }
        break;
    }
  }

  removeFromList(listType: string, index: number) {
    switch(listType) {
      case 'actors':
        this.actors.splice(index, 1);
        break;
      case 'directors':
        this.directors.splice(index, 1);
        break;
      case 'genres':
        this.genres.splice(index, 1);
        break;
    }
  }


  canUpdate(): boolean{
    return this.isThumbnailSelected &&
      this.movieTitle?.trim() !== '' && 
      this.movieDescription?.trim() !== '' && 
      this.actors.length > 0 && 
      this.directors.length > 0 && 
      this.genres.length > 0;
  }

  update(){
    if(this.canUpdate()){

        let actors = this.processList(this.actors);
        let directors = this.processList(this.directors);
        let genres = this.processList(this.genres);
        let thumbnail = this.base64String;

        if(this.selectedThumbnailFile){
          const reader = new FileReader();
          reader.onload = () => {
            const imageDataUrl = reader.result as string;
    
          this.imageCompress.compressFile(imageDataUrl, -1, 50, 50) 
              .then(compressedDataUrl => {

                this.convertFileToBase64(this.dataURLtoFile(compressedDataUrl, this.selectedThumbnailFile!.name))
                  .then(base64String => {
                    this.updateMovie(actors, directors, genres, base64String);
                  })
                  .catch(error => {
                    console.error('Error converting file to Base64:', error);
                  });

          })
          .catch(error => {
            console.error('Error compressing image:', error);
          });
          };
          reader.readAsDataURL(this.selectedThumbnailFile);

        }else{
          this.updateMovie(actors, directors, genres, thumbnail);
        }
        
    }
  }

  dataURLtoFile(dataUrl: string, fileName: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  }

  updateMovie(actors: string, directors: string, genres: string, thumbnail: string){
    this.movieService.updateMovie(this.movieName, this.resolution, this.movieTitle, this.movieDescription,
      actors, directors, genres,  thumbnail)
      .subscribe({
        next: result => {
          this.router.navigate(['feed']);
          console.log(result);
        },
        error: err => {
          alert("Error updating movie")
        }
    })
  }

  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // Handle successful file read
      reader.onload = () => {
        if (reader.result) {
          // The result is a Data URL (Base64 string)
          resolve(reader.result.toString());
        } else {
          reject(new Error("File could not be read"));
        }
      };

      // Handle errors during file reading
      reader.onerror = () => {
        reject(new Error("File reading error"));
      };

      reader.readAsDataURL(file);
    });
  }

  processList(inputList: string[]): string {
    const uniqueSorted = [...new Set(inputList)].sort();
  
    return uniqueSorted.join(',');
  }
}
