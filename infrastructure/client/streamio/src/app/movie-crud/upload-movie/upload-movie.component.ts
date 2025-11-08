import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { MovieService } from '../service/movie-service';
import { v4 as uuidv4 } from 'uuid';
import { Router } from '@angular/router';
import { NgxImageCompressService } from 'ngx-image-compress';

@Component({
  selector: 'app-upload-movie',
  templateUrl: './upload-movie.component.html',
  styleUrls: ['./upload-movie.component.css']
})
export class UploadMovieComponent{

  uploadUrl: string = "";
  isFileSelected: boolean = false;
  selectedFileName: string = ""; 
  selectedFile: File | null = null;

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

  videoWidth: number = 0;
  videoHeight: number = 0;
  
  predefinedGenres: string[] = ["Action", "Comedy", "Thriller", "Drama", "Horror", "Sci-Fi", "Romance", "Crime"];

  constructor(private http: HttpClient, 
    private movieService: MovieService,
    private router: Router,
    private imageCompress: NgxImageCompressService) {}


  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file && file.type.startsWith('video/')) {
      this.selectedFile = file;
      this.isFileSelected = true;
      this.selectedFileName = file.name;

      const video = document.createElement('video')
      video.addEventListener('loadedmetadata', event => {
        this.videoWidth = video.videoWidth;
        this.videoHeight = video.videoHeight;
      });
      video.src = URL.createObjectURL(file);
    } else {
      this.selectedFile = null;
      this.isFileSelected = false;
      this.selectedFileName = "";
      console.error('Selected file is not a video.');
    }
  }

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

  canUpload(): boolean {
    return this.isFileSelected && 
           this.isThumbnailSelected &&
           this.movieTitle.trim() !== '' && 
           this.movieDescription.trim() !== '' && 
           this.actors.length > 0 && 
           this.directors.length > 0 && 
           this.genres.length > 0;
  }

  uploadFile() {
    if (this.canUpload()) {
      const resolution = this.getVideoResolution();
      const actors = this.processList(this.actors);
      const directors = this.processList(this.directors);
      const genres = this.processList(this.genres);
  
      if (this.selectedThumbnailFile) {
        const reader = new FileReader();
        reader.onload = () => {
          const imageDataUrl = reader.result as string;
  
          this.imageCompress.compressFile(imageDataUrl, -1, 50, 50) 
            .then(compressedDataUrl => {
  
              this.convertFileToBase64(this.dataURLtoFile(compressedDataUrl, this.selectedThumbnailFile!.name))
                .then(base64String => {

                  this.movieService.getUploadUrl(this.movieTitle, this.generateUUID(),
                    resolution, this.movieTitle, this.movieDescription, actors, directors, genres, base64String)
                    .subscribe({
                      next: (result) => {
                        this.uploadUrl = result.upload_url;
                        this.sendMovie();
                      },
                      error: (result) => {
                        console.log(result);
                      }
                    });
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
      } else {
        console.error('No thumbnail selected.');
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

  sendMovie() {
      
    const fileBlob = new Blob([this.selectedFile!], { type: this.selectedFile!.type });

    const headers = new HttpHeaders({
      'Content-Type': this.selectedFile!.type,
      skip: 'true'
    });

    this.http.put(this.uploadUrl, fileBlob, { headers: headers, observe: 'response' })
      .subscribe(response => {
        console.log('Upload complete', response);
        this.router.navigate(['feed']);
      }, error => {
        console.error('Upload failed', error);
        alert('Upload failed');
      });
  }

  processList(inputList: string[]): string {
    const uniqueSorted = [...new Set(inputList)].sort((a, b) => a.localeCompare(b));
  
    return uniqueSorted.join(',');
  }

  generateUUID(): string {
    return uuidv4().split('-')[0];
  }

  getVideoResolution(): string {
    const tolerance = 0.05; // 5% tolerance
  
    if (this.isWithinTolerance(this.videoWidth, 3840, tolerance) && this.isWithinTolerance(this.videoHeight, 2160, tolerance)) {
      return "2160p";
    } else if (this.isWithinTolerance(this.videoWidth, 2560, tolerance) && this.isWithinTolerance(this.videoHeight, 1440, tolerance)) {
      return "1440p";
    } else if (this.isWithinTolerance(this.videoWidth, 1920, tolerance) && this.isWithinTolerance(this.videoHeight, 1080, tolerance)) {
      return "1080p";
    } else if (this.isWithinTolerance(this.videoWidth, 1280, tolerance) && this.isWithinTolerance(this.videoHeight, 720, tolerance)) {
      return "720p";
    } else if (this.isWithinTolerance(this.videoWidth, 854, tolerance) && this.isWithinTolerance(this.videoHeight, 480, tolerance)) {
      return "480p";
    } else if (this.isWithinTolerance(this.videoWidth, 640, tolerance) && this.isWithinTolerance(this.videoHeight, 360, tolerance)) {
      return "360p";
    } else {
      return "240p";
    }
  }
  
  isWithinTolerance(value: number, target: number, tolerance: number): boolean {
    return value >= target * (1 - tolerance) && value <= target * (1 + tolerance);
  }

}

