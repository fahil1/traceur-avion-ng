import { Component, OnInit } from '@angular/core';
import { Recording } from '../recording';
import { RecordingsService } from '../recordings.service';

@Component({
  selector: 'app-recordings',
  templateUrl: './recordings.component.html',
  styleUrls: ['./recordings.component.css']
})
export class RecordingsComponent implements OnInit {
  ajaxCompleted = false;
  deleteModal = false;
  playingRecord = false;
  recordSnapshot = {
    speed: 540,
    heading: 140,
    altitude: 1500,
    vertical_rate: 19,
    occuredAt: null
  };
  recordings: Recording[];
  selected: Recording = new Recording();
  speedThresh = {
    '0': {color: 'cyan'},
    '700': {color: 'orange'},
  };
  altitudeThresh = {
    '0': {color: 'cyan'},
    '8': {color: 'orange'},
  };
  constructor(
    private recordingsService: RecordingsService
  ) { }

  ngOnInit() {
    this.getRecordings();
  }


  getRecordings() {
    this.recordingsService.getRecordings().subscribe(r => {
      this.recordings = r;
      this.ajaxCompleted = true;
    });
  }

  onRemove() {
    this.recordingsService.removeRecording(this.selected).subscribe(_ => {
        this.deleteModal = false;
        this.recordings = this.recordings.filter(el => el !== this.selected);
      }
    );
  }

}
