import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/service/AuthService';
import { MovieService } from 'src/app/movie-crud/service/movie-service';


interface ToggleItem {
  name: string;
  checked: boolean;
}

@Component({
  selector: 'app-user-subscriptions',
  templateUrl: './user-subscriptions.component.html',
  styleUrls: ['./user-subscriptions.component.css']
})
export class UserSubscriptionsComponent implements OnInit{

  topics: ToggleItem[] = [];
  hasSubscription: boolean = false;

  constructor(private movieService: MovieService, private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.movieService.getTopics().subscribe({
      next: result =>{
        console.log(result)
        result.forEach(element => {
          let arns = element.TopicArn?.split(':');
          let topic = this.formatArn(arns![arns?.length! - 1]);
          this.topics.push({name : topic, checked : false});
        })

        // this.movieService.getSubscriptions(this.authService.username).subscribe({
          this.movieService.getSubscriptions(this.authService.getUsername()!).subscribe({
          next: result => {
            this.hasSubscription = true;
            console.log(result)
            let userTopics = result.topics?.SS;
            userTopics = userTopics!.filter(topic => topic !== "" && topic !== undefined);
            const userTopicsLower = userTopics!.map(str => str.toLowerCase());
            this.topics.forEach(topic => {
              if (userTopicsLower!.includes(topic.name.toLowerCase())) {
                topic.checked = true; 
              }
            });
          },
          error: err => {
            // console.log("EROR: get subscriptions")
          }
        })
      }
    })
  }

  toggleSelection(item: any): void {
    item.checked = !item.checked;
  }

  submitSelection(): void {
    const selectedTopics = this.topics.filter(topic => topic.checked);

    console.log('Submitting selection:', selectedTopics);

    let topics: string[] = [];

    selectedTopics.forEach(topic => topics.push(topic.name));

    if(this.hasSubscription){
      this.movieService.putSubscription(this.authService.getUsername()!, this.authService.getEmail()!, topics).subscribe({
        next: result => {
          this.router.navigate(['feed']);
        }
      })
    }else{
      this.movieService.postSubscription(this.authService.getUsername()!, this.authService.getEmail()!, topics).subscribe({
        next: result => {
          this.router.navigate(['feed']);
        }
      })
    }
  }


  formatArn(input: string): string {
    return input
      .split('_') 
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) 
      .join(' '); 
  }
}
