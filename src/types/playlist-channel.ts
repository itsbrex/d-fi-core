interface itemsType {
  item_id: string; // 'page_id=channels/dance,render_id=608a93738223d615200e6390ea48f8f3,version=channel-cms.1.0,section_id=long-card-horizontal-grid,section_position=0,module_id=be55d60e-e3c3-421a-9ea9-aef6f0c63c6c,module_type=playlists,layout=playlists_layout_long-card-horizontal-grid,content_source=playlists_content-source_custom,content_source_count=0,content_programming_count=8,section_content=playlist%3A1291471565%3Bplaylist%3A2249258602%3Bplaylist%3A2113355604%3Bplaylist%3A1950512362%3Bplaylist%3A1495242491%3Bplaylist%3A6090195324%3Bplaylist%3A706093725%3Bplaylist%3A7837492422,item_type=playlist,item_id=1291471565,item_position=0'
  id: string; // '1291471565'
  type: 'playlist';
  data: {
    NB_FAN: number; // 231133
    NB_SONG: number; // 50
    PARENT_USER_ID: string; // '2834392844'
    PICTURE_TYPE: 'playlist';
    PLAYLIST_ID: string; // '1291471565'
    PLAYLIST_PICTURE: string; // 'c5eb1bf10a83734c032e983ef190105e'
    STATUS: number; // 0
    TITLE: string; // 'Dance Party'
    TYPE: string; // '0'
    DATE_MOD: string; // '2021-04-02 19:57:27'
    DATE_ADD: string; // '2020-12-15 19:31:07'
    DESCRIPTION: string; // 'The biggest dance hits to keep the party going!'
    __TYPE__: 'playlist';
  };
  target: string; // '/playlist/1291471565'
  title: string; // 'Dance Party'
  subtitle: string; // '50 tracks'
  description: string; // 'The biggest dance hits to keep the party going!'
  pictures: [
    {
      md5: string; // 'c5eb1bf10a83734c032e983ef190105e'
      type: 'playlist';
    },
  ];
  weight: number; // 1
  layout_parameters: {
    cta: {
      type: 'browse';
      label: 'BROWSE';
    };
  };
}

interface sectionsType {
  layout: string; // 'long-card-horizontal-grid'
  section_id: string; // 'page_id=channels/dance,render_id=608a93738223d615200e6390ea48f8f3,version=channel-cms.1.0,section_id=long-card-horizontal-grid,section_position=0,module_id=be55d60e-e3c3-421a-9ea9-aef6f0c63c6c,module_type=playlists,layout=playlists_layout_long-card-horizontal-grid,content_source=playlists_content-source_custom,content_source_count=0,content_programming_count=8,section_content=playlist%3A1291471565%3Bplaylist%3A2249258602%3Bplaylist%3A2113355604%3Bplaylist%3A1950512362%3Bplaylist%3A1495242491%3Bplaylist%3A6090195324%3Bplaylist%3A706093725%3Bplaylist%3A7837492422'
  items: itemsType[];
  title: string; // 'Top Dance & EDM playlists'
  target: string; // '/channels/module/be55d60e-e3c3-421a-9ea9-aef6f0c63c6c'
  related: {
    target: string; // '/channels/module/be55d60e-e3c3-421a-9ea9-aef6f0c63c6c'
    label: string; // 'View all'
    mandatory: boolean;
  };
  alignment: string; // 'left'
  group_id: string; // '606c10eda2d91'
  hasMoreItems: boolean;
}

export interface playlistChannelType {
  version: string; // '2.3'
  page_id: string; // 'page_id=channels/dance,render_id=608a93738223d615200e6390ea48f8f3,version=channel-cms.1.0'
  ga: {
    screen_name: string; // 'page-dance'
  };
  title: string; // 'Dance & EDM'
  persistent: boolean;
  sections: sectionsType[];
  expire: number; // 1617707131
}
